import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { 
  sendPasswordResetEmail, 
  isEmailConfigured, 
  sendVerificationEmail, 
  generateVerificationCode, 
  hashVerificationCode,
  constantTimeCompare
} from "./email";

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const MAX_RESENDS_PER_HOUR = 3;

async function generateAuthToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await storage.createAuthToken(userId, token);
  return token;
}

export async function validateAuthToken(token: string): Promise<string | null> {
  const authToken = await storage.getAuthToken(token);
  return authToken?.userId || null;
}

export async function invalidateAuthToken(token: string): Promise<void> {
  await storage.deleteAuthToken(token);
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

function sanitizeUser(user: SelectUser): Omit<SelectUser, 'password'> & { emailVerified: boolean } {
  const { password: _, ...safeUser } = user;
  return {
    ...safeUser,
    emailVerified: user.emailVerified ?? false,
  };
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Debug logging for native app auth troubleshooting (development only)
    if (process.env.NODE_ENV !== 'production') {
      if (req.path.startsWith('/api') && req.path !== '/api/login' && req.path !== '/api/register') {
        const origin = req.headers.origin || 'no-origin';
        const hasAuthToken = !!req.headers['x-auth-token'];
        const hasSession = req.isAuthenticated();
        console.log(`[Auth Debug] ${req.method} ${req.path} | Origin: ${origin} | Session: ${hasSession} | X-Auth-Token: ${hasAuthToken}`);
      }
    }
    
    if (req.isAuthenticated()) {
      return next();
    }
    
    const authToken = req.headers['x-auth-token'] as string | undefined;
    if (authToken) {
      const userId = await validateAuthToken(authToken);
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          (req as any).user = user;
          (req as any).isAuthenticated = () => true;
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[Auth Debug] Token auth successful for user ${user.username}`);
          }
        }
      } else {
        // Production-safe logging (no token value exposed)
        console.log(`[Auth] Token validation failed for ${req.method} ${req.path}`);
      }
    }
    next();
  });

  passport.use(
    new LocalStrategy(
      { usernameField: 'identifier' },
      async (identifier, password, done) => {
        try {
          let user;
          
          if (identifier.includes('@')) {
            user = await storage.getUserByEmail(identifier.toLowerCase());
          } else {
            user = await storage.getUserByUsername(identifier.toLowerCase());
          }
          
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid username/email or password" });
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, email } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Determine final username (provided or derived from email)
      const finalUsername = username || email.split('@')[0];
      
      // Check for duplicate username (case-insensitive)
      const existingUsername = await storage.getUserByUsername(finalUsername);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username: finalUsername,
        password: await hashPassword(password),
        firstName: firstName || null,
        lastName: lastName || null,
        email: email.toLowerCase(),
      });

      // Create onboarding progress record for the new user
      await storage.createOnboardingProgress(user.id);
      
      // Add user to the Loretta community
      await storage.addUserToLorettaCommunity(user.id);

      // Generate and send verification email
      const verificationCode = generateVerificationCode();
      const tokenHash = hashVerificationCode(verificationCode);
      const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      
      await storage.createEmailVerificationToken(user.id, tokenHash, expiresAt);
      
      const userName = firstName || finalUsername;
      await sendVerificationEmail(email.toLowerCase(), userName, verificationCode, VERIFICATION_CODE_EXPIRY_MINUTES);

      req.login(user, async (err) => {
        if (err) return next(err);
        const authToken = await generateAuthToken(user.id);
        res.status(201).json({ 
          user: sanitizeUser(user), 
          authToken,
          requiresVerification: true,
          message: "Please check your email for a verification code."
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    const origin = req.headers.origin || 'no-origin';
    const hasAuthHeader = !!req.headers['x-auth-token'];
    const contentType = req.headers['content-type'] || 'none';
    console.log(`[Auth:login] LOGIN_REQUEST_RECEIVED: origin=${origin} | contentType=${contentType} | hasAuthHeader=${hasAuthHeader} | bodyKeys=${Object.keys(req.body || {}).join(',')}`);
    
    if (!req.body || (!req.body.identifier && !req.body.username)) {
      console.error(`[Auth:login] LOGIN_MISSING_IDENTIFIER: Request body has no identifier/username field. bodyKeys=${Object.keys(req.body || {}).join(',')}`);
      return res.status(400).json({ message: "LOGIN_MISSING_IDENTIFIER: No username or email provided", errorCode: "LOGIN_MISSING_IDENTIFIER" });
    }
    if (!req.body.password) {
      console.error(`[Auth:login] LOGIN_MISSING_PASSWORD: Request body has no password field`);
      return res.status(400).json({ message: "LOGIN_MISSING_PASSWORD: No password provided", errorCode: "LOGIN_MISSING_PASSWORD" });
    }
    
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message?: string } | undefined) => {
      if (err) {
        console.error(`[Auth:login] LOGIN_PASSPORT_ERROR: Passport strategy threw: ${err.message}`);
        return res.status(500).json({ message: `LOGIN_PASSPORT_ERROR: Authentication system error`, errorCode: "LOGIN_PASSPORT_ERROR" });
      }
      if (!user) {
        const reason = info?.message || "Invalid credentials";
        console.log(`[Auth:login] LOGIN_AUTH_FAILED: Passport rejected credentials: ${reason}`);
        return res.status(401).json({ message: reason, errorCode: "LOGIN_AUTH_FAILED" });
      }
      
      console.log(`[Auth:login] LOGIN_PASSPORT_OK: User authenticated: ${user.username} (id=${user.id})`);
      
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error(`[Auth:login] LOGIN_SESSION_CREATE_FAIL: req.login threw: ${loginErr.message}`);
          return res.status(500).json({ message: "LOGIN_SESSION_CREATE_FAIL: Could not create session", errorCode: "LOGIN_SESSION_CREATE_FAIL" });
        }
        
        let authToken: string;
        try {
          authToken = await generateAuthToken(user.id);
        } catch (tokenErr: any) {
          console.error(`[Auth:login] LOGIN_TOKEN_GENERATE_FAIL: Could not generate auth token for user ${user.id}: ${tokenErr?.message || tokenErr}`);
          return res.status(500).json({ message: "LOGIN_TOKEN_GENERATE_FAIL: Could not generate authentication token", errorCode: "LOGIN_TOKEN_GENERATE_FAIL" });
        }
        
        console.log(`[Auth:login] LOGIN_SUCCESS: user=${user.username} id=${user.id} tokenLength=${authToken.length}`);
        res.status(200).json({ user: sanitizeUser(user), authToken });
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    const authToken = req.headers['x-auth-token'] as string | undefined;
    if (authToken) {
      await invalidateAuthToken(authToken);
    }
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(sanitizeUser(req.user!));
    }
    
    const authToken = req.headers['x-auth-token'] as string | undefined;
    if (authToken) {
      const userId = await validateAuthToken(authToken);
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          return res.json(sanitizeUser(user));
        }
      }
    }
    
    return res.sendStatus(401);
  });

  app.get("/api/config/public", (req, res) => {
    res.json({
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    });
  });

  // Password reset endpoints
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email.toLowerCase());
      
      if (!user) {
        return res.json({ 
          success: true, 
          message: "If an account with this email exists, a reset code has been sent.",
          emailConfigured: isEmailConfigured()
        });
      }

      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.createPasswordResetToken(user.id, token, expiresAt);

      const userName = user.firstName || user.username;
      const emailResult = await sendPasswordResetEmail(
        user.email!,
        userName,
        token,
        15
      );

      res.json({ 
        success: emailResult.success, 
        message: isEmailConfigured() 
          ? "If an account exists with this email, a reset code has been sent to your inbox."
          : "Reset code generated. Check the server console for the code (SendGrid not configured).",
        emailConfigured: isEmailConfigured(),
        expiresIn: "15 minutes"
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/password-reset/verify", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Reset code is required" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: "This reset code has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      res.json({ valid: true, message: "Reset code is valid" });
    } catch (error) {
      console.error("Password reset verify error:", error);
      res.status(500).json({ message: "Failed to verify reset code" });
    }
  });

  app.post("/api/password-reset/complete", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Reset code and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid reset code" });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: "This reset code has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      // Hash new password and update user
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);

      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset complete error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Email verification endpoints
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!req.isAuthenticated() && !req.headers['x-auth-token']) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user || (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!code || typeof code !== 'string' || code.length !== 6) {
        return res.status(400).json({ message: "Valid 6-digit verification code required" });
      }

      // Check if user is already verified
      if (user.emailVerified) {
        return res.json({ success: true, message: "Email already verified" });
      }

      // Check if user is locked out
      if (user.emailVerificationLockedUntil && new Date() < user.emailVerificationLockedUntil) {
        const remainingMinutes = Math.ceil((user.emailVerificationLockedUntil.getTime() - Date.now()) / 60000);
        return res.status(429).json({ 
          message: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
          lockedUntil: user.emailVerificationLockedUntil
        });
      }

      const verificationToken = await storage.getEmailVerificationToken(user.id);
      
      if (!verificationToken) {
        return res.status(400).json({ message: "No verification code found. Please request a new one." });
      }

      if (new Date() > verificationToken.expiresAt) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      // Constant-time comparison of hashed codes
      const providedHash = hashVerificationCode(code);
      const isValid = constantTimeCompare(providedHash, verificationToken.tokenHash);

      if (!isValid) {
        // Increment failed attempts
        await storage.incrementEmailVerificationAttempts(user.id);
        const updatedUser = await storage.getUser(user.id);
        
        if (updatedUser && updatedUser.emailVerificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
          // Lock the account
          const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
          await storage.lockEmailVerification(user.id, lockoutUntil);
          return res.status(429).json({ 
            message: `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`,
            lockedUntil: lockoutUntil
          });
        }

        const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - (updatedUser?.emailVerificationAttempts || 0);
        return res.status(400).json({ 
          message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts
        });
      }

      // Success! Mark token as used and user as verified
      await storage.markEmailVerificationTokenUsed(verificationToken.id);
      await storage.setUserEmailVerified(user.id);

      // Get updated user
      const verifiedUser = await storage.getUser(user.id);
      
      res.json({ 
        success: true, 
        message: "Email verified successfully!",
        user: verifiedUser ? sanitizeUser(verifiedUser) : null
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  app.post("/api/resend-verification", async (req, res) => {
    try {
      if (!req.isAuthenticated() && !req.headers['x-auth-token']) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user || (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is already verified
      if (user.emailVerified) {
        return res.json({ success: true, message: "Email already verified" });
      }

      // Check rate limiting
      const existingToken = await storage.getEmailVerificationToken(user.id);
      
      if (existingToken) {
        // Check if max resends reached
        if (existingToken.resendCount >= MAX_RESENDS_PER_HOUR) {
          const hoursSinceLastResend = existingToken.lastResendAt 
            ? (Date.now() - existingToken.lastResendAt.getTime()) / (60 * 60 * 1000)
            : 0;
          
          if (hoursSinceLastResend < 1) {
            const minutesRemaining = Math.ceil(60 - (hoursSinceLastResend * 60));
            return res.status(429).json({ 
              message: `Maximum resend limit reached. Please wait ${minutesRemaining} minutes.`,
              retryAfterMinutes: minutesRemaining
            });
          }
        }

        // Check if last resend was too recent (minimum 60 seconds between resends)
        if (existingToken.lastResendAt) {
          const secondsSinceLastResend = (Date.now() - existingToken.lastResendAt.getTime()) / 1000;
          if (secondsSinceLastResend < 60) {
            const waitSeconds = Math.ceil(60 - secondsSinceLastResend);
            return res.status(429).json({ 
              message: `Please wait ${waitSeconds} seconds before requesting another code.`,
              retryAfterSeconds: waitSeconds
            });
          }
        }
      }

      // Delete old tokens and create new one
      await storage.deleteUserEmailVerificationTokens(user.id);
      
      const verificationCode = generateVerificationCode();
      const tokenHash = hashVerificationCode(verificationCode);
      const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      
      await storage.createEmailVerificationToken(user.id, tokenHash, expiresAt);
      
      // Reset attempt counter when new code is sent
      await storage.resetEmailVerificationAttempts(user.id);
      
      const userName = user.firstName || user.username;
      const emailResult = await sendVerificationEmail(
        user.email!,
        userName,
        verificationCode,
        VERIFICATION_CODE_EXPIRY_MINUTES
      );

      res.json({ 
        success: emailResult.success, 
        message: emailResult.success 
          ? "A new verification code has been sent to your email."
          : emailResult.message,
        expiresInMinutes: VERIFICATION_CODE_EXPIRY_MINUTES
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });
}
