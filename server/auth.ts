import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendPasswordResetEmail, isEmailConfigured } from "./email";

const authTokens: Map<string, string> = new Map();

function generateAuthToken(userId: string): string {
  const token = randomBytes(32).toString("hex");
  authTokens.set(token, userId);
  return token;
}

export function validateAuthToken(token: string): string | null {
  return authTokens.get(token) || null;
}

export function invalidateAuthToken(token: string): void {
  authTokens.delete(token);
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

function sanitizeUser(user: SelectUser): Omit<SelectUser, 'password'> {
  const { password: _, ...safeUser } = user;
  return safeUser;
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
    if (req.isAuthenticated()) {
      return next();
    }
    
    const authToken = req.headers['x-auth-token'] as string | undefined;
    if (authToken) {
      const userId = validateAuthToken(authToken);
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          (req as any).user = user;
          (req as any).isAuthenticated = () => true;
        }
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
            user = await storage.getUserByUsername(identifier);
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
      
      if (username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      const user = await storage.createUser({
        username: username || email.split('@')[0],
        password: await hashPassword(password),
        firstName: firstName || null,
        lastName: lastName || null,
        email: email.toLowerCase(),
      });

      // Create onboarding progress record for the new user
      await storage.createOnboardingProgress(user.id);
      
      // Add user to the Loretta community
      await storage.addUserToLorettaCommunity(user.id);

      req.login(user, (err) => {
        if (err) return next(err);
        const authToken = generateAuthToken(user.id);
        res.status(201).json({ user: sanitizeUser(user), authToken });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message?: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        const authToken = generateAuthToken(user.id);
        res.status(200).json({ user: sanitizeUser(user), authToken });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const authToken = req.headers['x-auth-token'] as string | undefined;
    if (authToken) {
      invalidateAuthToken(authToken);
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
      const userId = validateAuthToken(authToken);
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          return res.json(sanitizeUser(user));
        }
      }
    }
    
    return res.sendStatus(401);
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
}
