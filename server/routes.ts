import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";
import { userMissions, userInviteCodes, friendships, users } from "@shared/schema";
import { setupAuth } from "./auth";
import { HEALTH_NAVIGATOR_SYSTEM_PROMPT, EMOTION_CLASSIFICATION_PROMPT } from "./prompts";
import { XP_REWARDS, getXPRewardAmount, calculateLevelFromXP } from "./lib/xpManager";
import { processCheckin, processActivityLogged, processXpEarned, processMedicationTaken } from "./lib/achievementManager";
import { startMedicationAutoMissCron } from "./cron/medication-auto-miss";
import { resetMissionsForUser } from "./missionReset";
import { 
  insertQuestionnaireSchema, 
  insertUserProfileSchema,
  insertUserPreferencesSchema,
  insertUserGamificationSchema,
  insertRiskScoreSchema,
  insertUserMissionSchema,
  updateUserMissionSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  insertTeamInviteSchema,
} from "@shared/schema";
import { nanoid } from "nanoid";
import { 
  getSuggestedMissionTypes, 
  detectEmotionFromText,
  isLowMoodEmotion,
  type EmotionCategory,
} from "@shared/emotions";
import { convertQuestionnaireToMLFeatures, type MLFeature } from "./lib/nhanesMapping";
import { calculateAndSaveRiskScore, gatherFullFeatureSet, callMLPredictionAPI as callMLAPI } from "./lib/riskCalculation";
import { sendFeedbackEmail, sendFeedbackThankYouEmail } from "./email";

// Scaleway AI configuration
const SCALEWAY_BASE_URL = 'https://api.scaleway.ai/v1';
const SCALEWAY_MODEL = 'gemma-3-27b-it';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ScalewayResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

async function addXPAndCheckAchievements(userId: string, amount: number): Promise<{ xpRecord: any; achievementsUnlocked: string[]; bonusXp: number }> {
  const xpRecord = await storage.addXP(userId, amount);
  const achievementResult = await processXpEarned(userId, xpRecord.totalXp);
  return { 
    xpRecord, 
    achievementsUnlocked: achievementResult.achievementsUnlocked,
    bonusXp: achievementResult.totalXpAwarded 
  };
}

async function chatWithScaleway(messages: ChatMessage[], options?: { temperature?: number; max_tokens?: number }): Promise<string> {
  const apiKey = process.env.SCALEWAY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing SCALEWAY_API_KEY');
  }

  const response = await fetch(`${SCALEWAY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SCALEWAY_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Scaleway API Error ${response.status}: ${errorText}`);
  }

  const data: ScalewayResponse = await response.json();
  const assistantMessage = data?.choices?.[0]?.message?.content || '';

  return assistantMessage;
}

// Content moderation for AI safety
const BLOCKED_INPUT_PATTERNS = [
  /how\s+to\s+(kill|hurt|harm|poison)/i,
  /suicide\s+(method|how|way)/i,
  /make\s+(bomb|weapon|drug)/i,
  /illegal\s+drug/i,
  /(child|minor)\s*(porn|abuse)/i,
  /hack(ing)?\s+(into|password)/i,
];

const EMERGENCY_KEYWORDS = [
  /suicid(e|al)/i,
  /kill\s+(myself|me)/i,
  /want\s+to\s+die/i,
  /end\s+(my|it\s+all)/i,
  /self[- ]?harm/i,
  /overdose/i,
];

const EMERGENCY_RESPONSE = `I'm concerned about what you've shared. Please know that help is available:

**Emergency Numbers:**
- Germany: 112 (Emergency) or 0800 111 0 111 (Crisis Hotline)
- US: 911 (Emergency) or 988 (Suicide & Crisis Lifeline)
- International: Contact your local emergency services

You're not alone, and trained professionals are ready to help 24/7. Please reach out now.`;

function checkForEmergency(text: string): boolean {
  return EMERGENCY_KEYWORDS.some(pattern => pattern.test(text));
}

function isBlockedContent(text: string): boolean {
  return BLOCKED_INPUT_PATTERNS.some(pattern => pattern.test(text));
}

function sanitizeOutput(text: string): string {
  // Remove any accidentally leaked system prompt markers
  let sanitized = text.replace(/===.*?===/g, '');
  // Remove any instruction-like content that might have leaked
  sanitized = sanitized.replace(/STRICT BOUNDARIES|SAFETY GUARDRAILS|MUST refuse/gi, '');
  return sanitized.trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // =============================================================================
  // TODO: SECURITY - Add authentication middleware to all user data endpoints
  // =============================================================================
  // CRITICAL: The following endpoints currently accept any userId without verification:
  // - GET/POST /api/questionnaires/:userId
  // - GET/POST /api/profile/:userId  
  // - GET/POST /api/preferences/:userId
  // - GET/POST /api/gamification/:userId
  // - GET/POST /api/risk-scores/:userId
  // - GET/POST /api/emotional-checkins/:userId
  // - GET/POST/PATCH/DELETE /api/missions/:userId
  //
  // FIX REQUIRED:
  // 1. Add authentication check: if (!req.isAuthenticated()) return res.sendStatus(401)
  // 2. Verify userId matches logged-in user: if (req.user.id !== userId) return res.sendStatus(403)
  // 3. Consider using middleware to DRY up these checks
  // =============================================================================
  
  // Chat endpoint for Health Navigator with safety guardrails
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, weatherContext } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Get the latest user message for moderation
      const latestUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop();
      const userText = latestUserMessage?.content || '';

      // Check for emergency/crisis situations first - provide immediate help
      if (checkForEmergency(userText)) {
        console.log("[SAFETY] Emergency keywords detected, providing crisis resources");
        return res.json({ message: EMERGENCY_RESPONSE });
      }

      // Block clearly harmful content
      if (isBlockedContent(userText)) {
        console.log("[SAFETY] Blocked content detected");
        return res.json({ 
          message: "I'm your health and wellness assistant, so I can only help with health-related questions. Is there something about your health or wellness I can help with?" 
        });
      }

      // Fetch user's activated missions if authenticated
      let activeMissionsContext = '';
      if (req.isAuthenticated()) {
        const userId = (req.user as any).id;
        const userMissionsList = await storage.getUserMissions(userId);
        const activeMissions = userMissionsList.filter(m => m.isActive);
        
        if (activeMissions.length > 0) {
          const missionDescriptions = await Promise.all(
            activeMissions.map(async (m) => {
              const catalogMission = await storage.getMissionByKey(m.missionKey);
              const altMission = catalogMission ? await storage.getAlternativeFor(m.missionKey) : null;
              return {
                key: m.missionKey,
                title: catalogMission?.titleEn || m.missionKey,
                progress: m.progress,
                goal: catalogMission?.maxProgress || 0,
                alternativeTitle: altMission?.titleEn || null,
                alternativeKey: altMission?.missionKey || null,
              };
            })
          );
          
          activeMissionsContext = `\n\n=== USER'S ACTIVATED MISSIONS ===
The user currently has these missions ACTIVATED (in progress):
${missionDescriptions.map(m => `- "${m.title}" (key: ${m.key}, progress: ${m.progress}/${m.goal})${m.alternativeTitle ? ` → Alternative: "${m.alternativeTitle}"` : ''}`).join('\n')}

IMPORTANT - SUGGESTING ALTERNATIVES:
If the user expresses they CANNOT do one of their activated missions (phrases like "I can't", "I'm unable to", "it's too hard", "I don't feel up to", "I'm too tired for", "I can't do the walk", "jumping jacks are too hard today", etc.), you should:
1. Acknowledge their situation with empathy
2. Suggest the gentler alternative mission that corresponds to their activated mission
3. Use the tag [SUGGEST_MISSION] at the end to show them the alternative

Match what the user says to their activated missions:
${missionDescriptions.filter(m => m.alternativeTitle).map(m => `- If they mention "${m.title.toLowerCase()}" or related words → suggest "${m.alternativeTitle}"`).join('\n')}

Do NOT suggest alternatives for missions the user hasn't activated.
=== END ACTIVATED MISSIONS ===`;
        }
      }

      // Build dynamic context with weather information
      let dynamicContext = '';
      if (weatherContext) {
        const { isGoodForOutdoor, weatherDescription, temperature, warnings, usingDefaultLocation } = weatherContext;
        const locationNote = usingDefaultLocation 
          ? '\nNote: User has not enabled location services - this weather is for a default location (Berlin) and may not reflect their actual conditions.'
          : '';
        dynamicContext = `\n\n=== CURRENT WEATHER CONTEXT ===
Current weather${usingDefaultLocation ? ' (default location - user location unknown)' : ' at user\'s location'}:
- Conditions: ${weatherDescription || 'Unknown'}
- Temperature: ${temperature !== undefined ? `${temperature}°C` : 'Unknown'}
- Suitable for outdoor activities: ${isGoodForOutdoor ? 'YES' : 'NO'}
${warnings && warnings.length > 0 ? `- Weather warnings: ${warnings.join(', ')}` : ''}${locationNote}

${!isGoodForOutdoor && !usingDefaultLocation ? `IMPORTANT: The weather is currently BAD for outdoor activities. If the user has an outdoor mission activated (like walking or jumping jacks), proactively suggest an indoor alternative. For example:
- If they mention going for a walk, suggest "walking around your home" instead
- If they mention outdoor exercise, suggest indoor alternatives
- Be helpful about the weather situation without being overly cautious` : ''}
=== END WEATHER CONTEXT ===`;
      }

      // Check if user is asking about their risk score or health data
      let healthProfileContext = '';
      const riskKeywords = ['risk', 'score', 'health score', 'my score', 'risk score', 'diabetes', 'heart', 'stroke', 'my health', 'my results', 'my data', 'assessment'];
      const isAskingAboutRisk = riskKeywords.some(keyword => userText.toLowerCase().includes(keyword));
      
      if (isAskingAboutRisk && req.isAuthenticated()) {
        const userId = (req.user as any).id;
        try {
          // Fetch user's questionnaire answers
          const allAnswers = await storage.getAllQuestionnaireAnswers(userId);
          const mergedAnswers: Record<string, string> = {};
          allAnswers.forEach(a => {
            Object.assign(mergedAnswers, a.answers);
          });
          
          // Fetch user's profile
          const profile = await storage.getUserProfile(userId);
          
          // Fetch latest risk score
          const latestRiskScore = await storage.getLatestRiskScore(userId);
          
          // Build a human-readable summary of their health data
          const age = mergedAnswers.age || profile?.age || 'Not provided';
          const height = mergedAnswers.height || profile?.height || 'Not provided';
          const weight = mergedAnswers.weight_current || profile?.weight || 'Not provided';
          const hasHighBP = mergedAnswers.high_blood_pressure === 'yes' ? 'Yes' : mergedAnswers.high_blood_pressure === 'no' ? 'No' : 'Not provided';
          const hasHighCholesterol = mergedAnswers.high_cholesterol === 'yes' ? 'Yes' : mergedAnswers.high_cholesterol === 'no' ? 'No' : 'Not provided';
          const generalHealth = mergedAnswers.general_health || 'Not provided';
          const weekdaySleep = mergedAnswers.weekday_sleep || 'Not provided';
          const weekendSleep = mergedAnswers.weekend_sleep || 'Not provided';
          const moderateActivity = mergedAnswers.moderate_activity || 'Not provided';
          const sedentaryHours = mergedAnswers.sedentary_hours || 'Not provided';
          const takesAspirin = mergedAnswers.daily_aspirin === 'yes' ? 'Yes' : mergedAnswers.daily_aspirin === 'no' ? 'No' : 'Not provided';
          
          healthProfileContext = `\n\n=== USER'S HEALTH PROFILE (from their questionnaire) ===
This is the user's actual health data they provided during onboarding:

BIOMETRICS:
- Age: ${age}${age !== 'Not provided' ? ' years' : ''}
- Height: ${height}${height !== 'Not provided' ? ' cm' : ''}
- Weight: ${weight}${weight !== 'Not provided' ? ' kg' : ''}

MEDICAL CONDITIONS:
- High blood pressure: ${hasHighBP}
- High cholesterol: ${hasHighCholesterol}
- Takes daily aspirin: ${takesAspirin}

LIFESTYLE:
- Self-rated general health: ${generalHealth}
- Average weekday sleep: ${weekdaySleep}${weekdaySleep !== 'Not provided' ? ' hours' : ''}
- Average weekend sleep: ${weekendSleep}${weekendSleep !== 'Not provided' ? ' hours' : ''}
- Moderate physical activity: ${moderateActivity}${moderateActivity !== 'Not provided' ? ' hours/week' : ''}
- Sedentary time: ${sedentaryHours}${sedentaryHours !== 'Not provided' ? ' hours/day' : ''}

${latestRiskScore ? `CURRENT RISK SCORE (lower is healthier, 0-100 scale):
- Overall Health Risk: ${latestRiskScore.overallScore}/100` : 'RISK SCORE: Not yet calculated'}

IMPORTANT: When discussing risk scores, remember:
- LOWER scores mean BETTER health (0 = lowest risk, 100 = highest risk)
- Be encouraging and focus on positive actions they can take
- Reference their specific data when explaining factors
- If they have high scores, emphasize that these are estimates and encourage consulting healthcare providers
=== END HEALTH PROFILE ===`;
          
          console.log("[Chat] Added health profile context for risk-related query");
        } catch (error) {
          console.error("[Chat] Failed to fetch health profile context:", error);
          // Continue without the context if fetch fails
        }
      }

      const chatMessages: ChatMessage[] = [
        { role: "system", content: HEALTH_NAVIGATOR_SYSTEM_PROMPT + activeMissionsContext + dynamicContext + healthProfileContext },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ];

      const assistantMessage = await chatWithScaleway(chatMessages);
      
      // Sanitize output to prevent prompt leakage
      const safeResponse = sanitizeOutput(assistantMessage || "I'm sorry, I couldn't generate a response. Please try again.");
      
      res.json({ message: safeResponse });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: "Failed to get response from AI" });
    }
  });

  // ML Prediction API endpoint - uses full feature set from database
  app.post("/api/predict", async (req, res) => {
    const startTime = Date.now();
    
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = req.user as any;
      const userId = user.id;
      const username = user.username;
      
      // Gather full feature set from database (questionnaire + profile)
      const mergedAnswers = await gatherFullFeatureSet(userId);
      const mlFeatures = convertQuestionnaireToMLFeatures(mergedAnswers);
      
      console.log('[Prediction API] Gathered', Object.keys(mergedAnswers).length, 'answers for user:', username);
      console.log('[Prediction API] Converted to', mlFeatures.length, 'ML features');
      
      if (mlFeatures.length < 5) {
        return res.status(400).json({ 
          error: "Not enough features for prediction",
          features_count: mlFeatures.length,
          minimum_required: 5
        });
      }
      
      const mlResult = await callMLAPI(mlFeatures, username);
      
      if (!mlResult) {
        return res.status(500).json({ error: "ML API not configured or returned no result" });
      }
      
      const responseTime = Date.now() - startTime;
      console.log('[Prediction API] Received prediction:', mlResult, 'in', responseTime, 'ms');
      
      res.json({
        ...mlResult,
        _metadata: {
          method: 'ml_api',
          success: true,
          features_used: mlFeatures.length,
          response_time_ms: responseTime
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("[Prediction API] Error:", error);
      res.status(500).json({ 
        error: "Failed to get prediction from ML service",
        details: errorMessage
      });
    }
  });

  // ========================
  // Questionnaire Endpoints
  // ========================

  app.get("/api/questionnaires", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      console.log("[API] GET /api/questionnaires - Fetching questionnaires for:", userId);
      const answers = await storage.getAllQuestionnaireAnswers(userId);
      console.log("[API] Found", answers.length, "questionnaire records for user:", userId);
      res.json(answers);
    } catch (error) {
      console.error("[API] Error fetching questionnaires:", error);
      res.status(500).json({ error: "Failed to fetch questionnaire answers" });
    }
  });

  app.get("/api/questionnaires/:category", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { category } = req.params;
      console.log("[API] GET /api/questionnaires/:category - Fetching for:", { userId, category });
      const answers = await storage.getQuestionnaireAnswers(userId, category);
      res.json(answers || null);
    } catch (error) {
      console.error("[API] Error fetching questionnaire:", error);
      res.status(500).json({ error: "Failed to fetch questionnaire answers" });
    }
  });

  app.post("/api/questionnaires", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      console.log("[API] POST /api/questionnaires - Received body:", JSON.stringify(req.body));
      const dataWithUserId = { ...req.body, userId };
      const validatedData = insertQuestionnaireSchema.parse(dataWithUserId);
      console.log("[API] Validated questionnaire data:", JSON.stringify(validatedData));
      const saved = await storage.saveQuestionnaireAnswers(validatedData);
      console.log("[API] Questionnaire saved successfully:", saved.id);
      
      // Automatically recalculate risk score using full feature set
      try {
        const result = await calculateAndSaveRiskScore(userId);
        if (result.success) {
          console.log("[API] Risk score calculated from ML model after questionnaire update:", result.riskValue, "using", result.featuresUsed, "features");
        } else {
          console.log("[API] Risk score not updated:", result.error);
        }
      } catch (riskError) {
        console.error("[API] Failed to auto-recalculate risk score:", riskError);
      }
      
      res.json(saved);
    } catch (error) {
      console.error("[API] Error saving questionnaire:", error);
      res.status(400).json({ error: "Invalid questionnaire data" });
    }
  });

  // ========================
  // User Profile Endpoints
  // ========================

  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      console.log("[API] GET /api/profile - Fetching profile for:", userId);
      const profile = await storage.getUserProfile(userId);
      console.log("[API] Profile found:", profile ? "yes" : "no");
      res.json(profile || null);
    } catch (error) {
      console.error("[API] Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      console.log("[API] POST /api/profile - Received body:", JSON.stringify(req.body));
      const dataWithUserId = { ...req.body, userId };
      const validatedData = insertUserProfileSchema.parse(dataWithUserId);
      console.log("[API] Validated profile data for user:", validatedData.userId);
      
      const existingProfile = await storage.getUserProfile(userId);
      const saved = await storage.saveUserProfile(validatedData);
      console.log("[API] Profile saved successfully:", saved.id);
      
      let xpAwarded = 0;
      let achievementsUnlocked: string[] = [];
      if (!existingProfile) {
        const reward = getXPRewardAmount('profile_completed');
        const xpResult = await addXPAndCheckAchievements(userId, reward);
        xpAwarded = reward + xpResult.bonusXp;
        achievementsUnlocked = xpResult.achievementsUnlocked;
      }
      
      // Automatically recalculate risk score using full feature set when profile is updated
      if (saved.age || saved.height || saved.weight) {
        try {
          const result = await calculateAndSaveRiskScore(userId);
          if (result.success) {
            console.log("[API] Risk score calculated from ML model after profile update:", result.riskValue, "using", result.featuresUsed, "features");
          } else {
            console.log("[API] Risk score not updated:", result.error);
          }
        } catch (riskError) {
          console.error("[API] Failed to auto-recalculate risk score:", riskError);
        }
      }
      
      res.json({ ...saved, xpAwarded, achievementsUnlocked });
    } catch (error) {
      console.error("[API] Error saving profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // ========================
  // User Preferences Endpoints
  // ========================

  app.get("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      console.log("[API] GET /api/preferences - Fetching preferences for:", userId);
      const prefs = await storage.getUserPreferences(userId);
      console.log("[API] Preferences found:", prefs ? "yes" : "no");
      res.json(prefs || null);
    } catch (error) {
      console.error("[API] Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      console.log("[API] POST /api/preferences - Received body:", JSON.stringify(req.body));
      const dataWithUserId = { ...req.body, userId };
      const validatedData = insertUserPreferencesSchema.parse(dataWithUserId);
      console.log("[API] Validated preferences for user:", validatedData.userId);
      const saved = await storage.saveUserPreferences(validatedData);
      console.log("[API] Preferences saved successfully:", saved.id);
      res.json(saved);
    } catch (error) {
      console.error("[API] Error saving preferences:", error);
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });

  // ========================
  // Gamification Endpoints
  // ========================

  app.get("/api/gamification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      let gamification = await storage.getUserGamification(userId);
      
      if (!gamification) {
        gamification = await storage.saveUserGamification({
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lives: 5,
        });
      }
      
      const xpRecord = await storage.getUserXp(userId);
      const xp = xpRecord?.totalXp || 0;
      const level = calculateLevelFromXP(xp);
      
      // Calculate effective streak based on today's activity
      const isActiveToday = await storage.checkUserActiveToday(userId);
      const lastCheckIn = gamification.lastCheckIn;
      let effectiveStreak = gamification.currentStreak || 0;
      
      if (!isActiveToday) {
        // User hasn't been active today
        if (lastCheckIn) {
          const now = new Date();
          const hoursSinceLastCheckIn = (now.getTime() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastCheckIn >= 48) {
            // Missed more than a day, streak is broken
            effectiveStreak = 0;
          }
          // If 24-48 hours, streak is still valid but will break if they don't act today
        } else {
          // No previous check-in, streak is 0
          effectiveStreak = 0;
        }
      }
      
      res.json({
        ...gamification,
        currentStreak: effectiveStreak,
        xp,
        level,
        isActiveToday,
      });
    } catch (error) {
      console.error("Error fetching gamification:", error);
      res.status(500).json({ error: "Failed to fetch gamification data" });
    }
  });

  app.post("/api/gamification", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const dataWithUserId = { ...req.body, userId };
      const validatedData = insertUserGamificationSchema.parse(dataWithUserId);
      const saved = await storage.saveUserGamification(validatedData);
      res.json(saved);
    } catch (error) {
      console.error("Error saving gamification:", error);
      res.status(400).json({ error: "Invalid gamification data" });
    }
  });

  app.post("/api/gamification/xp", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { amount } = req.body;
      
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ error: "Invalid XP amount" });
      }
      
      const result = await addXPAndCheckAchievements(userId, amount);
      res.json({ 
        ...result.xpRecord, 
        achievementsUnlocked: result.achievementsUnlocked,
        bonusXp: result.bonusXp 
      });
    } catch (error) {
      console.error("Error adding XP:", error);
      res.status(500).json({ error: "Failed to add XP" });
    }
  });

  app.post("/api/gamification/checkin", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      
      const currentGamification = await storage.getUserGamification(userId);
      const isFirstCheckin = !currentGamification || currentGamification.currentStreak === 0;
      
      const updated = await storage.updateStreak(userId);
      
      let xpAwarded = 0;
      const allAchievementsUnlocked: string[] = [];
      
      const checkinReward = isFirstCheckin 
        ? getXPRewardAmount('first_checkin')
        : getXPRewardAmount('streak_update');
      
      const xpResult = await addXPAndCheckAchievements(userId, checkinReward);
      xpAwarded += checkinReward + xpResult.bonusXp;
      allAchievementsUnlocked.push(...xpResult.achievementsUnlocked);
      
      const achievementResult = await processCheckin(userId, updated.currentStreak || 0);
      xpAwarded += achievementResult.totalXpAwarded;
      allAchievementsUnlocked.push(...achievementResult.achievementsUnlocked);
      
      const finalXpRecord = await storage.getUserXp(userId);
      if (finalXpRecord) {
        const finalXpAchResult = await processXpEarned(userId, finalXpRecord.totalXp);
        xpAwarded += finalXpAchResult.totalXpAwarded;
        allAchievementsUnlocked.push(...finalXpAchResult.achievementsUnlocked);
      }
      
      res.json({ 
        ...updated, 
        xpAwarded,
        achievementsUnlocked: Array.from(new Set(allAchievementsUnlocked))
      });
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ error: "Failed to update streak" });
    }
  });

  // ========================
  // Risk Score Endpoints
  // ========================

  app.get("/api/risk-scores", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const scores = await storage.getAllRiskScores(userId);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching risk scores:", error);
      res.status(500).json({ error: "Failed to fetch risk scores" });
    }
  });

  app.get("/api/risk-scores/latest", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const score = await storage.getLatestRiskScore(userId);
      res.json(score || null);
    } catch (error) {
      console.error("Error fetching latest risk score:", error);
      res.status(500).json({ error: "Failed to fetch latest risk score" });
    }
  });

  app.post("/api/risk-scores", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const dataWithUserId = { ...req.body, userId };
      const validatedData = insertRiskScoreSchema.parse(dataWithUserId);
      const saved = await storage.saveRiskScore(validatedData);
      res.json(saved);
    } catch (error) {
      console.error("Error saving risk score:", error);
      res.status(400).json({ error: "Invalid risk score data" });
    }
  });

  app.post("/api/risk-scores/calculate", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      
      // Use centralized function that always gathers full feature set
      const result = await calculateAndSaveRiskScore(userId);
      
      if (!result.success) {
        if (result.error === 'Not enough features for ML model') {
          return res.status(400).json({ 
            error: "Not enough questionnaire answers to calculate risk score. Please complete more of the health questionnaire.",
            featuresProvided: result.featuresUsed || 0,
            featuresRequired: 5
          });
        }
        if (result.error === 'ML API returned no result') {
          return res.status(503).json({ 
            error: "Risk calculation service is temporarily unavailable. Please try again later."
          });
        }
        return res.status(500).json({ error: result.error });
      }
      
      const riskScore = await storage.getLatestRiskScore(userId);
      console.log('[Risk Calculation] ML model -> risk score:', result.riskValue, 'using', result.featuresUsed, 'features');
      res.json({ ...riskScore, usedMLModel: true, featuresUsed: result.featuresUsed });
    } catch (error) {
      console.error("[Risk Calculation] Error:", error);
      res.status(500).json({ error: "Failed to calculate risk score" });
    }
  });

  app.get("/api/risk-factors", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      
      const answers = await storage.getAllQuestionnaireAnswers(userId);
      
      const allAnswers: Record<string, string> = {};
      answers.forEach(a => {
        Object.assign(allAnswers, a.answers);
      });
      
      const riskFactors = calculateRiskFactors(allAnswers);
      res.json(riskFactors);
    } catch (error) {
      console.error("Error calculating risk factors:", error);
      res.status(500).json({ error: "Failed to calculate risk factors" });
    }
  });

  // ========================
  // Emotional Check-in Endpoints
  // ========================

  // AI-based emotion classification endpoint
  app.post("/api/classify-emotion", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log("[API] Classifying emotion for message:", message.substring(0, 50) + (message.length > 50 ? '...' : ''));

      const messages: ChatMessage[] = [
        { role: 'system', content: EMOTION_CLASSIFICATION_PROMPT },
        { role: 'user', content: message }
      ];

      // Use low temperature for more consistent single-word responses
      const aiResponse = await chatWithScaleway(messages, { temperature: 0.1, max_tokens: 50 });
      const responseText = aiResponse.trim().toLowerCase();
      
      console.log("[API] Raw AI response:", responseText);
      
      // Valid emotions from EMOTION_BANK
      const validEmotions = [
        'happy', 'sad', 'anxious', 'stressed', 'calm', 'peaceful', 'tired',
        'energetic', 'hyper', 'frustrated', 'angry', 'grateful', 'hopeful',
        'lonely', 'confused', 'sick', 'overwhelmed', 'motivated', 'bored', 'neutral'
      ];
      
      // Keyword-to-emotion fallback map for when AI responds with synonyms
      // Covers all 20 emotion categories with common synonyms from EMOTION_BANK
      const keywordToEmotion: Record<string, string> = {
        // neutral keywords
        'okay': 'neutral', 'ok': 'neutral', 'fine': 'neutral', 'alright': 'neutral',
        'so-so': 'neutral', 'normal': 'neutral', 'average': 'neutral', 'meh': 'neutral',
        // happy keywords  
        'great': 'happy', 'good': 'happy', 'wonderful': 'happy', 'amazing': 'happy',
        'fantastic': 'happy', 'excellent': 'happy', 'joyful': 'happy', 'excited': 'happy',
        'thrilled': 'happy', 'delighted': 'happy', 'cheerful': 'happy', 'pleased': 'happy',
        'well': 'happy', 'awesome': 'happy', 'super': 'happy', 'brilliant': 'happy',
        // sad keywords
        'down': 'sad', 'depressed': 'sad', 'unhappy': 'sad', 'blue': 'sad', 'low': 'sad',
        'miserable': 'sad', 'gloomy': 'sad', 'heartbroken': 'sad', 'melancholy': 'sad',
        // anxious keywords
        'worried': 'anxious', 'nervous': 'anxious', 'panicked': 'anxious', 'uneasy': 'anxious',
        'tense': 'anxious', 'apprehensive': 'anxious', 'fearful': 'anxious', 'jittery': 'anxious',
        // stressed keywords
        'pressure': 'stressed', 'swamped': 'stressed', 'strained': 'stressed', 'frazzled': 'stressed',
        // calm keywords
        'relaxed': 'calm', 'serene': 'calm', 'chill': 'calm', 'tranquil': 'calm',
        'composed': 'calm', 'collected': 'calm', 'mellow': 'calm',
        // peaceful keywords
        'harmonious': 'peaceful', 'balanced': 'peaceful', 'centered': 'peaceful', 'grounded': 'peaceful',
        'still': 'peaceful',
        // tired keywords
        'exhausted': 'tired', 'fatigued': 'tired', 'sleepy': 'tired', 'drained': 'tired',
        'weary': 'tired', 'lethargic': 'tired', 'sluggish': 'tired',
        // energetic keywords
        'pumped': 'energetic', 'active': 'energetic', 'vibrant': 'energetic', 'lively': 'energetic',
        'spirited': 'energetic', 'dynamic': 'energetic', 'alive': 'energetic',
        // hyper keywords
        'hyperactive': 'hyper', 'wired': 'hyper', 'buzzing': 'hyper', 'restless': 'hyper',
        'fidgety': 'hyper', 'amped': 'hyper', 'overstimulated': 'hyper',
        // frustrated keywords
        'annoyed': 'frustrated', 'irritated': 'frustrated', 'aggravated': 'frustrated', 'exasperated': 'frustrated',
        // angry keywords
        'mad': 'angry', 'furious': 'angry', 'upset': 'angry', 'enraged': 'angry',
        'livid': 'angry', 'irate': 'angry', 'fuming': 'angry',
        // grateful keywords
        'thankful': 'grateful', 'appreciative': 'grateful', 'blessed': 'grateful', 'fortunate': 'grateful',
        // hopeful keywords
        'optimistic': 'hopeful', 'positive': 'hopeful', 'confident': 'hopeful', 'encouraged': 'hopeful',
        'upbeat': 'hopeful', 'expectant': 'hopeful',
        // lonely keywords
        'isolated': 'lonely', 'alone': 'lonely', 'disconnected': 'lonely', 'solitary': 'lonely',
        'abandoned': 'lonely',
        // confused keywords
        'uncertain': 'confused', 'puzzled': 'confused', 'unsure': 'confused', 'lost': 'confused',
        'bewildered': 'confused', 'perplexed': 'confused',
        // sick keywords
        'ill': 'sick', 'unwell': 'sick', 'nauseous': 'sick', 'feverish': 'sick',
        'achy': 'sick', 'queasy': 'sick', 'poorly': 'sick',
        // overwhelmed keywords
        'overloaded': 'overwhelmed', 'drowning': 'overwhelmed', 'buried': 'overwhelmed', 'snowed': 'overwhelmed',
        // motivated keywords
        'driven': 'motivated', 'determined': 'motivated', 'inspired': 'motivated', 'eager': 'motivated',
        'focused': 'motivated', 'ambitious': 'motivated',
        // bored keywords
        'uninterested': 'bored', 'dull': 'bored', 'listless': 'bored', 'apathetic': 'bored',
        'disengaged': 'bored',
      };
      
      // First check if the response is exactly a valid emotion
      if (validEmotions.includes(responseText)) {
        console.log("[API] AI classified emotion as (exact match):", responseText);
        res.json({ emotion: responseText, success: true });
        return;
      }
      
      // Check if the response is a known keyword that maps to an emotion
      if (keywordToEmotion[responseText]) {
        const mappedEmotion = keywordToEmotion[responseText];
        console.log("[API] AI classified emotion as (keyword mapping):", responseText, "->", mappedEmotion);
        res.json({ emotion: mappedEmotion, success: true });
        return;
      }
      
      // If the AI included extra text, try to extract an emotion from the response
      // Look for the first valid emotion word in the response
      let foundEmotion: string | null = null;
      for (const emotion of validEmotions) {
        // Check for emotion as a standalone word
        const regex = new RegExp(`\\b${emotion}\\b`, 'i');
        if (regex.test(responseText)) {
          foundEmotion = emotion;
          break;
        }
      }
      
      if (foundEmotion) {
        console.log("[API] AI classified emotion as (extracted):", foundEmotion);
        res.json({ emotion: foundEmotion, success: true });
      } else if (responseText.includes('unclear') || responseText.includes('not enough') || responseText.includes('cannot determine')) {
        console.log("[API] AI indicated unclear emotion");
        res.json({ emotion: null, success: true, unclear: true });
      } else {
        // Last resort: check if any word in the response is a known keyword
        const words = responseText.split(/\s+/);
        for (const word of words) {
          if (keywordToEmotion[word]) {
            const mappedEmotion = keywordToEmotion[word];
            console.log("[API] AI classified emotion as (word keyword mapping):", word, "->", mappedEmotion);
            res.json({ emotion: mappedEmotion, success: true });
            return;
          }
        }
        
        console.log("[API] AI could not classify emotion, response was:", responseText);
        res.json({ emotion: null, success: true, unclear: true });
      }
    } catch (error) {
      console.error("Error classifying emotion:", error);
      res.status(500).json({ error: "Failed to classify emotion" });
    }
  });

  app.get("/api/emotional-checkins/latest", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const checkin = await storage.getLatestEmotionalCheckin(userId);
      res.json(checkin || null);
    } catch (error) {
      console.error("Error fetching latest emotional check-in:", error);
      res.status(500).json({ error: "Failed to fetch latest emotional check-in" });
    }
  });

  app.get("/api/emotional-checkins", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const checkins = await storage.getAllEmotionalCheckins(userId);
      res.json(checkins);
    } catch (error) {
      console.error("Error fetching all emotional check-ins:", error);
      res.status(500).json({ error: "Failed to fetch emotional check-ins" });
    }
  });

  app.post("/api/emotional-checkins", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { emotion, userMessage, aiResponse } = req.body;
      const xpAwarded = getXPRewardAmount('emotional_checkin');
      
      if (!emotion) {
        return res.status(400).json({ error: "emotion is required" });
      }

      // Check if this is the user's first emotional check-in
      const existingCheckins = await storage.getAllEmotionalCheckins(userId);
      const isFirstEmotionalCheckin = existingCheckins.length === 0;

      const saved = await storage.saveEmotionalCheckin({
        userId,
        emotion,
        userMessage,
        aiResponse,
        xpAwarded,
      });

      const xpResult = await addXPAndCheckAchievements(userId, xpAwarded);
      const allAchievementsUnlocked = [...xpResult.achievementsUnlocked];
      let totalBonusXp = xpResult.bonusXp;

      // Update streak on every emotional check-in (handles daily tracking)
      const updatedGamification = await storage.updateStreak(userId);
      const currentStreak = updatedGamification.currentStreak || 1;
      
      // Process checkin achievements (daily-dedication for first, streak-legend for streak progress)
      const checkinResult = await processCheckin(userId, currentStreak);
      allAchievementsUnlocked.push(...checkinResult.achievementsUnlocked);
      totalBonusXp += checkinResult.totalXpAwarded;

      res.json({ 
        ...saved, 
        streak: currentStreak,
        achievementsUnlocked: Array.from(new Set(allAchievementsUnlocked)),
        totalXpAwarded: xpAwarded + totalBonusXp 
      });
    } catch (error) {
      console.error("Error saving emotional check-in:", error);
      res.status(500).json({ error: "Failed to save emotional check-in" });
    }
  });

  // Get weekly check-in stats (which days this week had check-ins)
  app.get("/api/emotional-checkins/weekly-stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const checkins = await storage.getAllEmotionalCheckins(userId);
      
      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday is 0, Monday is 1
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      
      // Get end of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Track which days have check-ins (0 = Monday, 6 = Sunday)
      const completedDays: boolean[] = [false, false, false, false, false, false, false];
      
      for (const checkin of checkins) {
        if (checkin.checkedInAt) {
          const checkinDate = new Date(checkin.checkedInAt);
          if (checkinDate >= weekStart && checkinDate <= weekEnd) {
            const dayIndex = (checkinDate.getDay() + 6) % 7; // Convert Sun=0 to Mon=0 format
            completedDays[dayIndex] = true;
          }
        }
      }
      
      const daysCompleted = completedDays.filter(Boolean).length;
      
      res.json({
        completedDays,
        daysCompleted,
        totalDays: 7
      });
    } catch (error) {
      console.error("Error fetching weekly check-in stats:", error);
      res.status(500).json({ error: "Failed to fetch weekly check-in stats" });
    }
  });

  // ========================
  // Missions Catalog Endpoint
  // ========================

  app.get("/api/missions-catalog", async (req, res) => {
    try {
      const catalog = await storage.getAllMissions();
      res.json(catalog);
    } catch (error) {
      console.error("Error fetching missions catalog:", error);
      res.status(500).json({ error: "Failed to fetch missions catalog" });
    }
  });

  // Get alternative mission for a specific parent mission key
  app.get("/api/missions/:missionKey/alternative", async (req, res) => {
    try {
      const { missionKey } = req.params;
      const alternative = await storage.getAlternativeFor(missionKey);
      
      if (!alternative) {
        return res.json({ alternative: null });
      }
      
      res.json({
        alternative: {
          id: alternative.id,
          missionKey: alternative.missionKey,
          titleEn: alternative.titleEn,
          titleDe: alternative.titleDe,
          descriptionEn: alternative.descriptionEn,
          descriptionDe: alternative.descriptionDe,
          xpReward: alternative.xpReward,
          icon: alternative.icon,
          color: alternative.color,
          maxProgress: alternative.maxProgress,
        }
      });
    } catch (error) {
      console.error("Error fetching alternative mission:", error);
      res.status(500).json({ error: "Failed to fetch alternative mission" });
    }
  });

  app.post("/api/missions/suggest", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { context, language = 'en', weatherContext } = req.body;
      
      // Outdoor missions that should get weather-based alternatives
      const outdoorMissionKeys = ['walking', 'jumping-jacks'];
      
      // Check if weather is bad for outdoor activities (only if we have real location)
      const isBadWeather = weatherContext && 
        !weatherContext.isGoodForOutdoor && 
        !weatherContext.usingDefaultLocation;

      const catalog = await storage.getAllMissions();
      const userMissions = await storage.getUserMissions(userId);
      const questionnaire = await storage.getQuestionnaireAnswers(userId, 'lifestyle');
      const emotionalCheckins = await storage.getAllEmotionalCheckins(userId);
      const profile = await storage.getUserProfile(userId);

      const inactiveMissionsWithUserData = catalog
        .map(cm => {
          const userMission = userMissions.find(um => um.missionKey === cm.missionKey);
          return { catalog: cm, userMission };
        })
        .filter(({ userMission }) => userMission && !userMission.isActive);

      if (inactiveMissionsWithUserData.length === 0) {
        return res.json({ 
          mission: null, 
          reason: language === 'de' 
            ? 'Alle verfügbaren Missionen sind bereits aktiviert!' 
            : 'All available missions are already activated!' 
        });
      }

      let bestResult = inactiveMissionsWithUserData[0];
      let bestScore = 0;
      let reason = '';

      const recentEmotion = emotionalCheckins.length > 0 
        ? emotionalCheckins[emotionalCheckins.length - 1]?.emotion as EmotionCategory | null
        : null;
      const contextLower = (context || '').toLowerCase();
      
      const contextEmotion = detectEmotionFromText(contextLower);
      const effectiveEmotion = contextEmotion || recentEmotion;
      const suggestedMissionTypes = effectiveEmotion 
        ? getSuggestedMissionTypes(effectiveEmotion) 
        : [];

      for (const { catalog: mission, userMission } of inactiveMissionsWithUserData) {
        let score = 0;

        if (suggestedMissionTypes.includes(mission.missionKey)) {
          score += 50;
          if (effectiveEmotion) {
            const emotionReasonMap: Record<string, { en: string; de: string }> = {
              stressed: { 
                en: 'This mission can help reduce stress.', 
                de: 'Diese Mission kann helfen, Stress abzubauen.' 
              },
              anxious: { 
                en: 'This can help calm your mind.', 
                de: 'Das kann dir helfen, dich zu beruhigen.' 
              },
              tired: { 
                en: 'This could help boost your energy.', 
                de: 'Das könnte dir Energie geben.' 
              },
              sad: { 
                en: 'Activity can help lift your mood.', 
                de: 'Bewegung kann deine Stimmung heben.' 
              },
              energetic: { 
                en: 'Great way to channel your energy!', 
                de: 'Tolle Möglichkeit, deine Energie zu nutzen!' 
              },
              hyper: { 
                en: 'This can help you focus that energy.', 
                de: 'Das kann dir helfen, diese Energie zu fokussieren.' 
              },
              overwhelmed: { 
                en: 'A small step to help you feel better.', 
                de: 'Ein kleiner Schritt, um dich besser zu fühlen.' 
              },
              sick: { 
                en: 'Gentle activity to support your recovery.', 
                de: 'Sanfte Aktivität zur Unterstützung deiner Genesung.' 
              },
              motivated: { 
                en: 'Perfect for your current motivation!', 
                de: 'Perfekt für deine aktuelle Motivation!' 
              },
              bored: { 
                en: 'A fun activity to shake things up.', 
                de: 'Eine spaßige Aktivität für Abwechslung.' 
              },
              peaceful: { 
                en: 'Maintain your calm with this gentle activity.', 
                de: 'Bewahre deine Ruhe mit dieser sanften Aktivität.' 
              },
              calm: { 
                en: 'Perfect for your relaxed state.', 
                de: 'Perfekt für deinen entspannten Zustand.' 
              },
            };
            const emotionReason = emotionReasonMap[effectiveEmotion];
            if (emotionReason) {
              reason = language === 'de' ? emotionReason.de : emotionReason.en;
            }
          }
        }

        if (contextLower.includes('water') || contextLower.includes('hydrat') || contextLower.includes('thirst')) {
          if (mission.missionKey === 'water-glasses') {
            score += 45;
            reason = language === 'de' 
              ? 'Hydriert zu bleiben ist wichtig für deine Gesundheit.' 
              : 'Staying hydrated is important for your health.';
          }
        }

        if (contextLower.includes('energy') || contextLower.includes('exercise') || contextLower.includes('active')) {
          if (mission.missionKey === 'jumping-jacks' || mission.missionKey === 'walking') {
            score += 35;
            reason = language === 'de' 
              ? 'Eine kurze Aktivität könnte dir Energie geben.' 
              : 'A quick activity could give you energy.';
          }
        }

        const physicalActivity = questionnaire?.answers?.physicalActivity;
        if (physicalActivity === 'sedentary' || physicalActivity === 'light') {
          if (mission.missionKey === 'jumping-jacks' || mission.missionKey === 'walking') {
            score += 25;
          }
        }

        score += (mission.xpReward || 0) / 10;
        score += 10;

        if (score > bestScore) {
          bestScore = score;
          bestResult = { catalog: mission, userMission };
        }
      }

      if (!reason) {
        reason = language === 'de' 
          ? `Diese Mission passt gut zu deinen aktuellen Gesundheitszielen.` 
          : `This mission fits well with your current health goals.`;
      }

      const { catalog: bestMission, userMission: bestUserMission } = bestResult;
      
      // Check if user has low mood and should get alternative
      // ONLY suggest alternatives if the original mission is ACTIVATED
      const latestCheckin = await storage.getLatestEmotionalCheckin(userId);
      const isLowMood = latestCheckin && isLowMoodEmotion(latestCheckin.emotion);
      const today = new Date().toDateString();
      const checkinDate = latestCheckin?.checkedInAt ? new Date(latestCheckin.checkedInAt).toDateString() : null;
      const isCheckinToday = checkinDate === today;
      const missionIsActive = bestUserMission?.isActive === true;
      const isOutdoorMission = outdoorMissionKeys.includes(bestMission.missionKey);
      
      // Show alternative if: mission is active AND (low mood today OR bad weather for outdoor mission)
      const shouldShowMoodAlternative = missionIsActive && isLowMood && isCheckinToday && !bestMission.isAlternative;
      const shouldShowWeatherAlternative = missionIsActive && isBadWeather && isOutdoorMission && !bestMission.isAlternative;
      const shouldShowAlternative = shouldShowMoodAlternative || shouldShowWeatherAlternative;
      
      let alternativeMission = null;
      let alternativeReason = '';
      
      if (shouldShowAlternative) {
        const altMission = await storage.getAlternativeFor(bestMission.missionKey);
        if (altMission) {
          alternativeMission = {
            id: altMission.id,
            missionKey: altMission.missionKey,
            title: language === 'de' ? altMission.titleDe : altMission.titleEn,
            description: language === 'de' ? altMission.descriptionDe : altMission.descriptionEn,
            xpReward: altMission.xpReward,
            icon: altMission.icon,
            color: altMission.color,
            maxProgress: altMission.maxProgress,
          };
          
          // Set reason based on trigger
          if (shouldShowWeatherAlternative) {
            alternativeReason = language === 'de' 
              ? 'Das Wetter ist nicht ideal für draußen. Hier ist eine Indoor-Alternative.' 
              : 'Weather isn\'t great for outdoor activities. Here\'s an indoor alternative.';
          } else {
            alternativeReason = language === 'de' 
              ? 'Hier ist eine sanftere Alternative, die zu deiner aktuellen Stimmung passt.' 
              : 'Here\'s a gentler alternative that matches your current mood.';
          }
          reason = alternativeReason;
        }
      }
      
      const localizedMission = {
        id: bestMission.id,
        missionKey: bestMission.missionKey,
        userMissionId: bestUserMission?.id,
        title: language === 'de' ? bestMission.titleDe : bestMission.titleEn,
        description: language === 'de' ? bestMission.descriptionDe : bestMission.descriptionEn,
        xpReward: bestMission.xpReward,
        icon: bestMission.icon,
        color: bestMission.color,
        maxProgress: bestMission.maxProgress,
      };

      res.json({ 
        mission: alternativeMission || localizedMission, 
        originalMission: alternativeMission ? localizedMission : null,
        isAlternative: !!alternativeMission,
        reason 
      });
    } catch (error) {
      console.error("Error suggesting mission:", error);
      res.status(500).json({ error: "Failed to suggest mission" });
    }
  });

  // ========================
  // User Mission Endpoints
  // ========================

  app.get("/api/missions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      
      await resetMissionsForUser(userId);
      
      const userMissions = await storage.ensureDefaultMissionsForUser(userId);
      
      const latestCheckin = await storage.getLatestEmotionalCheckin(userId);
      const isLowMood = latestCheckin && isLowMoodEmotion(latestCheckin.emotion);
      const today = new Date().toDateString();
      const checkinDate = latestCheckin?.checkedInAt ? new Date(latestCheckin.checkedInAt).toDateString() : null;
      const isCheckinToday = checkinDate === today;
      
      let missionData: any[] = [];
      
      for (const userMission of userMissions) {
        const catalogMission = await storage.getMissionByKey(userMission.missionKey);
        
        let displayMission = catalogMission;
        let alternativeMission = null;
        let showAlternative = false;
        
        // Only show alternative if: mission is ACTIVATED AND (low mood OR bad weather)
        const missionIsActive = userMission.isActive === true;
        if (missionIsActive && isLowMood && isCheckinToday && catalogMission && !catalogMission.isAlternative) {
          const altMission = await storage.getAlternativeFor(catalogMission.missionKey);
          if (altMission) {
            alternativeMission = altMission;
            showAlternative = true;
          }
        }
        
        missionData.push({
          ...userMission,
          catalog: catalogMission,
          alternativeMission,
          showAlternative,
          isLowMood: isLowMood && isCheckinToday,
        });
      }
      
      res.json(missionData);
    } catch (error) {
      console.error("Error fetching missions:", error);
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  app.post("/api/missions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const dataWithUserId = { ...req.body, userId };
      const validatedData = insertUserMissionSchema.parse(dataWithUserId);
      const created = await storage.createUserMission(validatedData);
      res.json(created);
    } catch (error) {
      console.error("Error creating mission:", error);
      res.status(400).json({ error: "Invalid mission data" });
    }
  });

  app.patch("/api/missions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const validatedData = updateUserMissionSchema.parse(req.body);
      
      if (validatedData.isActive === true && !validatedData.activatedAt) {
        validatedData.activatedAt = new Date();
      }
      
      // Get current mission state to check progress changes and completion status
      const [currentMission] = await db.select().from(userMissions).where(eq(userMissions.id, id));
      const wasCompleted = currentMission?.completed ?? false;
      const isBeingCompleted = validatedData.completed === true && !wasCompleted;
      const isBeingUncompleted = validatedData.completed === false && wasCompleted;
      
      // Get catalog mission for max progress clamping
      const catalogMission = currentMission ? await storage.getMissionByKey(currentMission.missionKey) : null;
      const maxProgress = catalogMission?.maxProgress ?? 999;
      
      // Track progress changes for per-increment XP rewards
      // Clamp progress values to valid range (0 to maxProgress)
      const previousProgress = Math.max(0, Math.min(currentMission?.progress ?? 0, maxProgress));
      const rawNewProgress = validatedData.progress ?? previousProgress;
      const clampedNewProgress = Math.max(0, Math.min(rawNewProgress, maxProgress));
      
      // Override progress in validatedData with clamped value
      if (validatedData.progress !== undefined) {
        validatedData.progress = clampedNewProgress;
      }
      
      const progressDelta = clampedNewProgress - previousProgress;
      
      // Set completedAt timestamp when completing, clear it when undoing
      if (isBeingCompleted) {
        validatedData.completedAt = new Date();
      } else if (isBeingUncompleted) {
        validatedData.completedAt = null;
      }
      
      const updated = await storage.updateUserMission(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ error: "Mission not found" });
      }
      
      // Award XP for each progress increment (not just on completion)
      // The UI says "XP each" meaning users earn XP for every step, not just once at the end
      if (progressDelta !== 0 && catalogMission && catalogMission.xpReward && catalogMission.xpReward > 0) {
        const xpToAward = catalogMission.xpReward * progressDelta;
        if (xpToAward > 0) {
          const xpResult = await addXPAndCheckAchievements(userId, xpToAward);
          console.log(`[Missions] Awarded ${xpToAward} XP (${catalogMission.xpReward} x ${progressDelta} increments) to user ${userId} for mission ${currentMission?.missionKey}. Achievements unlocked: ${xpResult.achievementsUnlocked.length}`);
        } else if (xpToAward < 0) {
          // Progress decreased (undo) - deduct XP
          await storage.deductXP(userId, Math.abs(xpToAward));
          console.log(`[Missions] Deducted ${Math.abs(xpToAward)} XP (${catalogMission.xpReward} x ${Math.abs(progressDelta)} decrements) from user ${userId} for mission ${currentMission?.missionKey}`);
        }
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating mission:", error);
      res.status(400).json({ error: "Invalid mission data" });
    }
  });

  app.post("/api/missions/activate-alternative", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { parentMissionKey, alternativeMissionKey } = req.body;
      
      if (!parentMissionKey || !alternativeMissionKey) {
        return res.status(400).json({ error: "parentMissionKey and alternativeMissionKey are required" });
      }
      
      // Check if the parent/original mission is ACTIVATED
      const parentUserMission = await db.select().from(userMissions)
        .where(and(eq(userMissions.userId, userId), eq(userMissions.missionKey, parentMissionKey)));
      
      if (parentUserMission.length === 0 || !parentUserMission[0].isActive) {
        return res.status(400).json({ error: "You need to have the original mission activated first before switching to an alternative" });
      }
      
      const latestCheckin = await storage.getLatestEmotionalCheckin(userId);
      const today = new Date().toDateString();
      const checkinDate = latestCheckin?.checkedInAt ? new Date(latestCheckin.checkedInAt).toDateString() : null;
      
      if (!latestCheckin || !isLowMoodEmotion(latestCheckin.emotion) || checkinDate !== today) {
        return res.status(400).json({ error: "Alternative missions are only available when you've checked in with a low mood today" });
      }
      
      const altMission = await storage.getMissionByKey(alternativeMissionKey);
      if (!altMission || !altMission.isAlternative || altMission.alternativeOf !== parentMissionKey) {
        return res.status(400).json({ error: "Invalid alternative mission" });
      }
      
      const existingAlt = await db.select().from(userMissions)
        .where(and(eq(userMissions.userId, userId), eq(userMissions.missionKey, alternativeMissionKey)));
      
      if (existingAlt.length > 0) {
        const updated = await storage.updateUserMission(existingAlt[0].id, {
          isActive: true,
          activatedAt: new Date(),
          progress: 0,
          completed: false,
        });
        return res.json({ ...updated, type: 'updated' });
      }
      
      const created = await storage.createUserMission({
        userId,
        missionId: altMission.id,
        missionKey: altMission.missionKey,
        title: altMission.titleEn,
        description: altMission.descriptionEn,
        category: altMission.category || 'daily',
        xpReward: altMission.xpReward,
        progress: 0,
        maxProgress: altMission.maxProgress || 1,
        completed: false,
        isActive: true,
        activatedAt: new Date(),
      });
      
      res.json({ ...created, type: 'created' });
    } catch (error) {
      console.error("Error activating alternative mission:", error);
      res.status(500).json({ error: "Failed to activate alternative mission" });
    }
  });

  app.delete("/api/missions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { id } = req.params;
      await storage.deleteUserMission(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting mission:", error);
      res.status(500).json({ error: "Failed to delete mission" });
    }
  });

  app.post("/api/missions/:userId/reset", async (req, res) => {
    try {
      const { userId } = req.params;
      const missions = await storage.resetUserMissions(userId);
      res.json(missions);
    } catch (error) {
      console.error("Error resetting missions:", error);
      res.status(500).json({ error: "Failed to reset missions" });
    }
  });

  // ========================
  // Medication Tracking Endpoints
  // ========================

  // Get all medications for the current user
  app.get("/api/medications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const userMedications = await storage.getUserMedications(userId);
      
      // Get adherence data for each medication
      const medicationsWithAdherence = await Promise.all(
        userMedications.map(async (med) => {
          const adherence = await storage.getMedicationAdherence(med.id);
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          let dosesTakenToday = 0;
          
          if (med.frequency === 'daily') {
            // For daily medications, count doses taken today
            const logsToday = await storage.getMedicationLogsForDate(userId, todayStr);
            dosesTakenToday = logsToday.filter(log => log.medicationId === med.id).length;
          } else if (med.frequency === 'weekly') {
            // For weekly medications, count doses taken this week
            // Week starts on Sunday (0) and ends on Saturday (6)
            const dayOfWeek = today.getDay();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            
            // Get all logs for this medication from the last 7 days
            const weekLogs = await storage.getMedicationLogs(med.id, 7);
            dosesTakenToday = weekLogs.filter(log => {
              const logDate = new Date(log.takenAt!);
              return logDate >= startOfWeek;
            }).length;
          }
          // For 'as-needed', dosesTakenToday stays 0 (no progress tracking)
          
          // Calculate actual adherence based on days since creation
          const totalDosesTaken = adherence?.totalDosesTaken || 0;
          let totalDosesScheduled = 0;
          let adherencePercent = 100;
          
          // Start at 100% adherence - only calculate if there's history
          if (med.frequency === 'daily' && med.createdAt) {
            const createdDate = new Date(med.createdAt);
            createdDate.setHours(0, 0, 0, 0);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            
            // Only count completed days (exclude today since user still has time to take doses)
            const completedDays = Math.floor((todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (completedDays > 0) {
              // Calculate doses that should have been taken on completed days
              totalDosesScheduled = completedDays * (med.dosesPerDay || 1);
              // Cap taken doses at scheduled to handle extra doses gracefully
              const cappedTaken = Math.min(totalDosesTaken, totalDosesScheduled);
              adherencePercent = Math.round((cappedTaken / totalDosesScheduled) * 100);
            }
            // If completedDays is 0 (created today), adherence stays at 100%
          } else if (med.frequency === 'weekly' && med.createdAt) {
            const createdDate = new Date(med.createdAt);
            createdDate.setHours(0, 0, 0, 0);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            
            // Only count completed weeks (exclude current week)
            const completedWeeks = Math.floor((todayDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
            
            if (completedWeeks > 0) {
              totalDosesScheduled = completedWeeks * (med.dosesPerDay || 1);
              const cappedTaken = Math.min(totalDosesTaken, totalDosesScheduled);
              adherencePercent = Math.round((cappedTaken / totalDosesScheduled) * 100);
            }
            // If completedWeeks is 0 (created this week), adherence stays at 100%
          }
          // For 'as-needed', adherence stays at 100%
          
          return {
            ...med,
            streak: adherence?.currentStreak || 0,
            longestStreak: adherence?.longestStreak || 0,
            totalDosesTaken,
            totalDosesScheduled,
            adherencePercent,
            dosesTakenToday,
          };
        })
      );
      
      res.json(medicationsWithAdherence);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  });

  // Get a specific medication
  app.get("/api/medications/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      // Verify ownership
      if (medication.userId !== (req.user as any).id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const adherence = await storage.getMedicationAdherence(id);
      const logs = await storage.getMedicationLogs(id, 30);
      
      res.json({
        ...medication,
        streak: adherence?.currentStreak || 0,
        longestStreak: adherence?.longestStreak || 0,
        totalDosesTaken: adherence?.totalDosesTaken || 0,
        recentLogs: logs,
      });
    } catch (error) {
      console.error("Error fetching medication:", error);
      res.status(500).json({ error: "Failed to fetch medication" });
    }
  });

  // Create a new medication
  app.post("/api/medications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const { name, dosage, scheduledTimes, notes, frequency, dosesPerDay, explanation, simpleExplanation } = req.body;
      
      if (!name || !frequency) {
        return res.status(400).json({ error: "Missing required fields: name, frequency" });
      }
      
      const medication = await storage.createMedication({
        userId,
        name,
        dosage: dosage || '',
        timing: frequency, // Legacy field - use frequency as timing
        scheduledTimes: scheduledTimes || [],
        notes: notes || null,
        frequency,
        dosesPerDay: dosesPerDay || (scheduledTimes?.length || 1),
        xpPerDose: 0,
        explanation,
        simpleExplanation,
        isActive: true,
      });
      
      res.json(medication);
    } catch (error) {
      console.error("Error creating medication:", error);
      res.status(500).json({ error: "Failed to create medication" });
    }
  });

  // Update a medication
  app.patch("/api/medications/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      if (medication.userId !== (req.user as any).id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updated = await storage.updateMedication(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating medication:", error);
      res.status(500).json({ error: "Failed to update medication" });
    }
  });

  // Delete a medication
  app.delete("/api/medications/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      if (medication.userId !== (req.user as any).id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.deleteMedication(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting medication:", error);
      res.status(500).json({ error: "Failed to delete medication" });
    }
  });

  // Log a medication dose
  app.post("/api/medications/:id/log", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const { id: medicationId } = req.params;
      const { doseNumber } = req.body;
      
      const medication = await storage.getMedication(medicationId);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      if (medication.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if this dose was already logged today
      const logsToday = await storage.getMedicationLogsForDate(userId, today);
      const existingDose = logsToday.find(
        log => log.medicationId === medicationId && log.doseNumber === (doseNumber || 1)
      );
      
      if (existingDose) {
        return res.status(400).json({ error: "This dose was already logged today" });
      }
      
      const log = await storage.logMedicationDose({
        medicationId,
        userId,
        doseNumber: doseNumber || 1,
        scheduledDate: today,
        xpAwarded: 0,
      });
      
      // Get updated adherence
      const adherence = await storage.getMedicationAdherence(medicationId);
      
      // Calculate user-wide medication streak and trigger achievement
      const userMedicationStreak = await storage.getUserMedicationStreak(userId);
      const achievementResult = await processMedicationTaken(userId, userMedicationStreak);
      
      res.json({
        success: true,
        log,
        xpAwarded: 0,
        achievementXpAwarded: achievementResult.totalXpAwarded,
        streak: adherence?.currentStreak || 1,
        achievementsUnlocked: achievementResult.achievementsUnlocked,
      });
    } catch (error) {
      console.error("Error logging medication dose:", error);
      res.status(500).json({ error: "Failed to log medication dose" });
    }
  });

  // Mark a medication dose as missed
  app.post("/api/medications/:id/missed", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const { id: medicationId } = req.params;
      const { doseNumber } = req.body;
      
      const medication = await storage.getMedication(medicationId);
      
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }
      
      if (medication.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if this dose was already logged today
      const logsToday = await storage.getMedicationLogsForDate(userId, today);
      const existingDose = logsToday.find(
        log => log.medicationId === medicationId && log.doseNumber === (doseNumber || 1)
      );
      
      if (existingDose) {
        return res.status(400).json({ error: "This dose was already logged today" });
      }
      
      const log = await storage.logMedicationDose({
        medicationId,
        userId,
        doseNumber: doseNumber || 1,
        scheduledDate: today,
        status: "missed",
        xpAwarded: 0,
      } as any);
      
      // Recalculate user-wide medication streak (achievement progress won't decrease but we keep it consistent)
      const userMedicationStreak = await storage.getUserMedicationStreak(userId);
      const achievementResult = await processMedicationTaken(userId, userMedicationStreak);
      
      res.json({
        success: true,
        log,
        message: "Dose marked as missed",
        achievementsUnlocked: achievementResult.achievementsUnlocked,
      });
    } catch (error) {
      console.error("Error marking medication dose as missed:", error);
      res.status(500).json({ error: "Failed to mark dose as missed" });
    }
  });

  // Undo a medication dose
  app.delete("/api/medications/:medicationId/log/:logId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { medicationId, logId } = req.params;
      const userId = (req.user as any).id;
      
      // Verify the medication belongs to the user
      const medication = await storage.getMedication(medicationId);
      if (!medication || medication.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const success = await storage.undoMedicationDose(logId, medicationId);
      
      if (!success) {
        return res.status(404).json({ error: "Log not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error undoing medication dose:", error);
      res.status(500).json({ error: "Failed to undo medication dose" });
    }
  });

  // Get medication logs for today
  app.get("/api/medications/logs/today", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const today = new Date().toISOString().split('T')[0];
      const logs = await storage.getMedicationLogsForDate(userId, today);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching medication logs:", error);
      res.status(500).json({ error: "Failed to fetch medication logs" });
    }
  });

  // Legacy endpoint for backward compatibility
  app.post("/api/medications/:userId/log-legacy", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { userId } = req.params;
      const { consecutiveDays } = req.body;
      
      if ((req.user as any).id !== userId) {
        return res.status(403).json({ error: "Can only log medications for yourself" });
      }
      
      if (typeof consecutiveDays !== 'number' || consecutiveDays < 0) {
        return res.status(400).json({ error: "consecutiveDays must be a non-negative number" });
      }
      
      // Process medication achievement
      const achievementResult = await processMedicationTaken(userId, consecutiveDays);
      
      res.json({
        success: true,
        consecutiveDays,
        achievementsUnlocked: achievementResult.achievementsUnlocked,
        xpAwarded: achievementResult.totalXpAwarded,
      });
    } catch (error) {
      console.error("Error logging medication:", error);
      res.status(500).json({ error: "Failed to log medication" });
    }
  });

  // ========================
  // Achievement Endpoints
  // ========================

  // Get all master achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const allAchievements = await storage.ensureMasterAchievements();
      res.json(allAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Sync/update master achievements (admin endpoint)
  app.post("/api/achievements/sync", async (req, res) => {
    try {
      const allAchievements = await storage.syncMasterAchievements();
      res.json({ 
        success: true, 
        message: `Synced ${allAchievements.length} achievements`,
        achievements: allAchievements 
      });
    } catch (error) {
      console.error("Error syncing achievements:", error);
      res.status(500).json({ error: "Failed to sync achievements" });
    }
  });

  app.get("/api/achievements/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      await storage.ensureUserHasAllAchievements(userId);
      const achievements = await storage.getUserAchievementWithDetails(userId);
      
      // Flatten the response for easier client consumption
      const flattenedAchievements = achievements.map(ua => ({
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        rarity: ua.achievement.rarity,
        maxProgress: ua.achievement.maxProgress,
        xpReward: ua.achievement.xpReward,
        category: ua.achievement.category,
        progress: ua.progress,
        unlocked: ua.unlocked,
        unlockedAt: ua.unlockedAt,
      }));
      
      res.json(flattenedAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/achievements/progress/:achievementId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { achievementId } = req.params;
      const { progress } = req.body;
      
      if (typeof progress !== 'number') {
        return res.status(400).json({ error: "Progress must be a number" });
      }
      
      const result = await storage.updateUserAchievementProgress(userId, achievementId, progress);
      
      if (!result.updated) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      res.json({ 
        ...result.updated, 
        justUnlocked: result.justUnlocked,
        xpAwarded: result.xpReward 
      });
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      res.status(500).json({ error: "Failed to update achievement progress" });
    }
  });

  // Recalculate all achievements for all users based on their actual data
  // This endpoint requires authentication and is intended for admin use
  app.post("/api/achievements/recalculate-all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      console.log("[Achievements] Starting full recalculation for all users...");
      
      // Get all users
      const allUsers = await db.select().from(users);
      const results: { userId: string; username: string; updates: Record<string, { oldProgress: number; newProgress: number; unlocked: boolean }> }[] = [];
      
      for (const user of allUsers) {
        const userId = user.id;
        const updates: Record<string, { oldProgress: number; newProgress: number; unlocked: boolean }> = {};
        
        // Ensure user has all achievements
        await storage.ensureUserHasAllAchievements(userId);
        const userAchievements = await storage.getUserAchievements(userId);
        
        // 1. daily-dedication: Check if user has done any check-in (maxProgress: 1)
        const gamification = await storage.getUserGamification(userId);
        const dailyDedicationProgress = gamification?.lastCheckIn ? 1 : 0;
        const dailyDed = userAchievements.find(a => a.achievementId === 'daily-dedication');
        if (dailyDed && dailyDedicationProgress > (dailyDed.progress || 0)) {
          const result = await storage.updateUserAchievementProgress(userId, 'daily-dedication', dailyDedicationProgress);
          updates['daily-dedication'] = { oldProgress: dailyDed.progress || 0, newProgress: dailyDedicationProgress, unlocked: result.justUnlocked };
        }
        
        // 2. streak-legend: Current streak value (maxProgress: 30)
        const streakProgress = gamification?.longestStreak || gamification?.currentStreak || 0;
        const streakLeg = userAchievements.find(a => a.achievementId === 'streak-legend');
        if (streakLeg && streakProgress > (streakLeg.progress || 0)) {
          const result = await storage.updateUserAchievementProgress(userId, 'streak-legend', streakProgress);
          updates['streak-legend'] = { oldProgress: streakLeg.progress || 0, newProgress: streakProgress, unlocked: result.justUnlocked };
        }
        
        // 3. wellness-warrior: Total XP (maxProgress: 5000)
        const xpRecord = await storage.getUserXp(userId);
        const totalXp = xpRecord?.totalXp || 0;
        const wellnessWarrior = userAchievements.find(a => a.achievementId === 'wellness-warrior');
        if (wellnessWarrior && totalXp > (wellnessWarrior.progress || 0)) {
          const result = await storage.updateUserAchievementProgress(userId, 'wellness-warrior', totalXp);
          updates['wellness-warrior'] = { oldProgress: wellnessWarrior.progress || 0, newProgress: totalXp, unlocked: result.justUnlocked };
        }
        
        // 4. medication-adherence: Check medication logs for consecutive days (maxProgress: 14)
        const medications = await storage.getUserMedications(userId);
        let maxConsecutiveDays = 0;
        for (const med of medications) {
          const adherence = await storage.getMedicationAdherence(med.id);
          if (adherence) {
            // Calculate consecutive days from adherence
            const consecutiveDays = Math.floor((adherence.totalDosesTaken || 0) / Math.max(1, (adherence.totalDosesScheduled || 1) / 14));
            maxConsecutiveDays = Math.max(maxConsecutiveDays, Math.min(consecutiveDays, 14));
          }
        }
        const medAch = userAchievements.find(a => a.achievementId === 'medication-adherence');
        if (medAch && maxConsecutiveDays > (medAch.progress || 0)) {
          const result = await storage.updateUserAchievementProgress(userId, 'medication-adherence', maxConsecutiveDays);
          updates['medication-adherence'] = { oldProgress: medAch.progress || 0, newProgress: maxConsecutiveDays, unlocked: result.justUnlocked };
        }
        
        // 5-7. Activity-based achievements: hydration-champion, sleep-master, step-champion
        // Get all user activities and deduplicate by date (one achievement increment per day)
        const activities = await storage.getUserActivities(userId, 365); // Get up to a year of activities
        
        // Track unique dates for each achievement type
        const hydrationDates = new Set<string>();
        const sleepDates = new Set<string>();
        const stepDates = new Set<string>();
        
        for (const activity of activities) {
          // Get goals from activity record (defaults if not set)
          const waterGoal = activity.waterGoal || 8;
          const stepsGoal = activity.stepsGoal || 10000;
          
          if (activity.water !== null && activity.water >= waterGoal) {
            hydrationDates.add(activity.date);
          }
          if (activity.sleepHours !== null && activity.sleepHours >= 7 && activity.sleepHours <= 8) {
            sleepDates.add(activity.date);
          }
          if (activity.steps !== null && activity.steps >= stepsGoal) {
            stepDates.add(activity.date);
          }
        }
        
        const hydrationDays = hydrationDates.size;
        const sleepDays = sleepDates.size;
        const stepDays = stepDates.size;
        
        const hydrationAch = userAchievements.find(a => a.achievementId === 'hydration-champion');
        if (hydrationAch && hydrationDays > (hydrationAch.progress || 0)) {
          const result = await storage.updateUserAchievementProgress(userId, 'hydration-champion', hydrationDays);
          updates['hydration-champion'] = { oldProgress: hydrationAch.progress || 0, newProgress: hydrationDays, unlocked: result.justUnlocked };
        }
        
        const sleepAch = userAchievements.find(a => a.achievementId === 'sleep-master');
        if (sleepAch && sleepDays > (sleepAch.progress || 0)) {
          const result = await storage.updateUserAchievementProgress(userId, 'sleep-master', sleepDays);
          updates['sleep-master'] = { oldProgress: sleepAch.progress || 0, newProgress: sleepDays, unlocked: result.justUnlocked };
        }
        
        const stepAch = userAchievements.find(a => a.achievementId === 'step-champion');
        if (stepAch && stepDays > (stepAch.progress || 0)) {
          const result = await storage.updateUserAchievementProgress(userId, 'step-champion', stepDays);
          updates['step-champion'] = { oldProgress: stepAch.progress || 0, newProgress: stepDays, unlocked: result.justUnlocked };
        }
        
        // 8. community-star: Check if user is in top 3 of loretta-community with 5+ members
        const lorettaMember = await storage.getTeamMember('loretta-community', userId);
        if (lorettaMember) {
          const members = await storage.getTeamMembers('loretta-community');
          const consentingMembers = members.filter(m => m.consentGiven === true);
          
          if (consentingMembers.length >= 5) {
            // Build leaderboard
            const leaderboardEntries = await Promise.all(
              consentingMembers.map(async (member) => {
                const memberXp = await storage.getUserXp(member.userId);
                return { userId: member.userId, xp: memberXp?.totalXp || 0 };
              })
            );
            leaderboardEntries.sort((a, b) => b.xp - a.xp);
            const userRank = leaderboardEntries.findIndex(e => e.userId === userId) + 1;
            
            if (userRank > 0 && userRank <= 3) {
              const communityAch = userAchievements.find(a => a.achievementId === 'community-star');
              if (communityAch && !communityAch.unlocked) {
                const result = await storage.updateUserAchievementProgress(userId, 'community-star', 1);
                updates['community-star'] = { oldProgress: 0, newProgress: 1, unlocked: result.justUnlocked };
              }
            }
          }
        }
        
        if (Object.keys(updates).length > 0) {
          results.push({ userId, username: user.username, updates });
        }
      }
      
      console.log(`[Achievements] Recalculation complete. Updated ${results.length} users.`);
      res.json({ 
        success: true, 
        message: `Recalculated achievements for ${allUsers.length} users`,
        usersUpdated: results.length,
        details: results
      });
    } catch (error) {
      console.error("Error recalculating achievements:", error);
      res.status(500).json({ error: "Failed to recalculate achievements" });
    }
  });

  // Recalculate XP for all users based on their actual activities
  // This resets XP and recalculates from missions, emotional check-ins, etc.
  app.post("/api/xp/recalculate-all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      console.log("[XP] Starting XP recalculation for all users...");
      
      const allUsers = await db.select().from(users);
      const results: { userId: string; username: string; oldXp: number; newXp: number }[] = [];
      
      for (const user of allUsers) {
        const userId = user.id;
        let calculatedXp = 0;
        
        // Get old XP
        const oldXpRecord = await storage.getUserXp(userId);
        const oldXp = oldXpRecord?.totalXp || 0;
        
        // 1. XP from completed missions (use mission catalog xpReward values)
        const userMissions = await storage.getUserMissions(userId);
        const completedMissions = userMissions.filter(m => m.completed);
        for (const mission of completedMissions) {
          const catalogMission = await storage.getMissionByKey(mission.missionKey);
          if (catalogMission && catalogMission.xpReward && catalogMission.xpReward > 0) {
            calculatedXp += catalogMission.xpReward;
          }
        }
        
        // 2. XP from emotional check-ins (10 XP each)
        const emotionalCheckins = await storage.getAllEmotionalCheckins(userId);
        calculatedXp += emotionalCheckins.length * 10;
        
        // 3. XP from onboarding steps (consent: 25, questionnaire: 100)
        const onboardingProgress = await storage.getOnboardingProgress(userId);
        if (onboardingProgress) {
          if (onboardingProgress.consentCompleted) calculatedXp += 25;
          if (onboardingProgress.questionnaireCompleted) calculatedXp += 100;
        }
        
        // 4. XP from daily streak updates (5 XP per day of current streak, capped)
        const gamification = await storage.getUserGamification(userId);
        const streakXp = Math.min((gamification?.currentStreak || 0) * 5, 150);
        calculatedXp += streakXp;
        
        // Set the new XP value
        await storage.setUserXp(userId, calculatedXp);
        
        if (oldXp !== calculatedXp) {
          results.push({ userId, username: user.username, oldXp, newXp: calculatedXp });
        }
      }
      
      console.log(`[XP] Recalculation complete. Updated ${results.length} users.`);
      res.json({ 
        success: true, 
        message: `Recalculated XP for ${allUsers.length} users`,
        usersUpdated: results.length,
        details: results.sort((a, b) => b.newXp - a.newXp)
      });
    } catch (error) {
      console.error("Error recalculating XP:", error);
      res.status(500).json({ error: "Failed to recalculate XP" });
    }
  });

  // ========================
  // Activity Endpoints
  // ========================

  app.get("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const days = parseInt(req.query.days as string) || 7;
      const activities = await storage.getUserActivities(userId, days);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/today", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const today = new Date().toISOString().split('T')[0];
      const activity = await storage.getUserActivityForDate(userId, today);
      res.json(activity || { 
        userId, 
        date: today, 
        steps: 0, 
        stepsGoal: 10000,
        sleepHours: 0, 
        sleepGoal: 8,
        heartRate: null, 
        calories: 0, 
        caloriesGoal: 2000,
        water: 0,
        waterGoal: 8
      });
    } catch (error) {
      console.error("Error fetching today's activity:", error);
      res.status(500).json({ error: "Failed to fetch today's activity" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { date, ...data } = req.body;
      const activityDate = date || new Date().toISOString().split('T')[0];
      const saved = await storage.saveUserActivity({ userId, date: activityDate, ...data });
      
      const achievementResult = await processActivityLogged(userId, activityDate, {
        steps: saved.steps || undefined,
        stepsGoal: saved.stepsGoal || undefined,
        sleepHours: saved.sleepHours || undefined,
        water: saved.water || undefined,
        waterGoal: saved.waterGoal || undefined,
      });
      
      res.json({ 
        ...saved, 
        achievementsUnlocked: achievementResult.achievementsUnlocked,
        xpAwarded: achievementResult.totalXpAwarded 
      });
    } catch (error) {
      console.error("Error saving activity:", error);
      res.status(400).json({ error: "Failed to save activity" });
    }
  });

  app.patch("/api/activities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { date, ...data } = req.body;
      const activityDate = date || new Date().toISOString().split('T')[0];
      const updated = await storage.updateUserActivity(userId, activityDate, data);
      
      if (updated) {
        const achievementResult = await processActivityLogged(userId, activityDate, {
          steps: updated.steps || undefined,
          stepsGoal: updated.stepsGoal || undefined,
          sleepHours: updated.sleepHours || undefined,
          water: updated.water || undefined,
          waterGoal: updated.waterGoal || undefined,
        });
        
        res.json({ 
          ...updated, 
          achievementsUnlocked: achievementResult.achievementsUnlocked,
          xpAwarded: achievementResult.totalXpAwarded 
        });
      } else {
        res.json(updated);
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      res.status(400).json({ error: "Failed to update activity" });
    }
  });

  // ========================
  // Team Endpoints
  // ========================

  app.post("/api/teams", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const validatedData = insertTeamSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const team = await storage.createTeam(validatedData);
      
      await storage.addTeamMember({
        teamId: team.id,
        userId,
        role: "owner",
        consentGiven: true,
        consentDate: new Date(),
      });
      
      res.json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({ error: "Invalid team data" });
    }
  });

  // Get the authenticated user's communities - MUST be before /api/teams/:id
  app.get("/api/teams/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ error: "Failed to fetch user teams" });
    }
  });

  // Get current user's membership in Loretta community - MUST be before /api/teams/:id
  app.get("/api/teams/loretta-community/membership", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const member = await storage.getTeamMember('loretta-community', userId);
      
      if (!member) {
        return res.status(404).json({ error: "Not a member of Loretta community" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching Loretta membership:", error);
      res.status(500).json({ error: "Failed to fetch membership" });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      const member = await storage.getTeamMember(id, userId);
      if (!member) {
        return res.status(403).json({ error: "Not a member of this team" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  // Legacy endpoint - redirects to /api/teams/me for authenticated user
  app.get("/api/teams/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      // Only allow users to fetch their own teams for security
      const authenticatedUserId = (req.user as any).id;
      const { userId } = req.params;
      
      if (authenticatedUserId !== userId) {
        return res.status(403).json({ error: "Can only view your own communities" });
      }
      
      const teams = await storage.getUserTeams(userId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching user teams:", error);
      res.status(500).json({ error: "Failed to fetch user teams" });
    }
  });

  app.patch("/api/teams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      
      const member = await storage.getTeamMember(id, userId);
      if (!member || member.role !== "owner") {
        return res.status(403).json({ error: "Only team owners can update the team" });
      }
      
      const updated = await storage.updateTeam(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(400).json({ error: "Invalid team data" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const userId = (req.user as any).id;
      
      const member = await storage.getTeamMember(id, userId);
      if (!member || member.role !== "owner") {
        return res.status(403).json({ error: "Only team owners can delete the team" });
      }
      
      await storage.deleteTeam(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ error: "Failed to delete team" });
    }
  });

  // ========================
  // Team Members Endpoints
  // ========================

  app.get("/api/teams/:teamId/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { teamId } = req.params;
      const currentUserId = (req.user as any).id;
      
      const currentMember = await storage.getTeamMember(teamId, currentUserId);
      if (!currentMember) {
        return res.status(403).json({ error: "Not a member of this team" });
      }
      
      const members = await storage.getTeamMembers(teamId);
      
      const membersWithUserInfo = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          const gamification = await storage.getUserGamification(member.userId);
          const xpRecord = await storage.getUserXp(member.userId);
          const profile = await storage.getUserProfile(member.userId);
          const xp = xpRecord?.totalXp || 0;
          const level = calculateLevelFromXP(xp);
          return {
            ...member,
            username: user?.username || "Unknown",
            xp,
            level,
            currentStreak: gamification?.currentStreak || 0,
            profilePhoto: profile?.profilePhoto || null,
          };
        })
      );
      
      res.json(membersWithUserInfo);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/teams/:teamId/members/:userId/consent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { teamId, userId } = req.params;
      const currentUserId = (req.user as any).id;
      const { consent } = req.body;
      
      if (currentUserId !== userId) {
        return res.status(403).json({ error: "Can only update your own consent" });
      }
      
      if (typeof consent !== "boolean") {
        return res.status(400).json({ error: "Consent must be a boolean" });
      }
      
      const updated = await storage.updateTeamMemberConsent(teamId, userId, consent);
      
      if (!updated) {
        return res.status(404).json({ error: "Team member not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating consent:", error);
      res.status(500).json({ error: "Failed to update consent" });
    }
  });

  app.delete("/api/teams/:teamId/members/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { teamId, userId } = req.params;
      const currentUserId = (req.user as any).id;
      
      const currentMember = await storage.getTeamMember(teamId, currentUserId);
      if (!currentMember) {
        return res.status(403).json({ error: "Not a member of this team" });
      }
      
      if (currentUserId !== userId && currentMember.role !== "owner") {
        return res.status(403).json({ error: "Only team owners can remove other members" });
      }
      
      await storage.removeTeamMember(teamId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // ========================
  // Community Leaderboard Endpoint
  // ========================

  app.get("/api/teams/:teamId/leaderboard", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { teamId } = req.params;
      const currentUserId = (req.user as any).id;
      const { sortBy = "xp", limit = "50" } = req.query;
      
      // Verify the requesting user is a member of this team
      const currentMember = await storage.getTeamMember(teamId, currentUserId);
      if (!currentMember) {
        return res.status(403).json({ error: "Not a member of this community" });
      }
      
      // Get all team members
      const members = await storage.getTeamMembers(teamId);
      
      // Filter to only members who explicitly gave consent
      const consentingMembers = members.filter(member => member.consentGiven === true);
      
      // Build leaderboard with gamification data (only for members who gave consent)
      const leaderboardEntries = await Promise.all(
        consentingMembers.map(async (member) => {
          
          const user = await storage.getUser(member.userId);
          const gamification = await storage.getUserGamification(member.userId);
          const xpRecord = await storage.getUserXp(member.userId);
          const userProfile = await storage.getUserProfile(member.userId);
          const xp = xpRecord?.totalXp || 0;
          const level = calculateLevelFromXP(xp);
          
          return {
            userId: member.userId,
            username: user?.username || "Unknown",
            firstName: user?.firstName || null,
            xp,
            level,
            currentStreak: gamification?.currentStreak || 0,
            longestStreak: gamification?.longestStreak || 0,
            role: member.role,
            joinedAt: member.joinedAt,
            profilePhoto: userProfile?.profilePhoto || null,
            consentGiven: true, // Already filtered by consent
          };
        })
      );
      
      // All entries are valid since we pre-filtered by consent
      const validEntries = leaderboardEntries;
      
      // Sort by the specified field
      const sortField = sortBy as string;
      validEntries.sort((a, b) => {
        if (sortField === "level") {
          // Sort by level first, then XP
          if (b.level !== a.level) return b.level - a.level;
          return b.xp - a.xp;
        } else if (sortField === "streak") {
          return b.currentStreak - a.currentStreak;
        } else {
          // Default: sort by XP
          return b.xp - a.xp;
        }
      });
      
      // Add rank to each entry
      const rankedEntries = validEntries.slice(0, parseInt(limit as string)).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
      
      // Get team info
      const team = await storage.getTeam(teamId);
      
      // Check for community-star achievement (top 3 with 5+ participating members)
      // Only check for Loretta community
      if (teamId === 'loretta-community' && validEntries.length >= 5) {
        const userRank = rankedEntries.find(e => e.userId === currentUserId)?.rank;
        if (userRank && userRank <= 3) {
          // User is in top 3 with 5+ members - trigger achievement
          await storage.ensureUserHasAllAchievements(currentUserId);
          const result = await storage.updateUserAchievementProgress(currentUserId, 'community-star', 1);
          if (result.justUnlocked) {
            // Award the XP for unlocking
            await storage.addXP(currentUserId, result.xpReward);
          }
        }
      }
      
      res.json({
        teamId,
        teamName: team?.name || "Unknown",
        totalMembers: members.length,
        participatingMembers: validEntries.length,
        leaderboard: rankedEntries,
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // ========================
  // Team Invite Endpoints
  // ========================

  app.post("/api/teams/:teamId/invites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { teamId } = req.params;
      const userId = (req.user as any).id;
      const { expiresAt } = req.body;
      
      const member = await storage.getTeamMember(teamId, userId);
      if (!member || member.role !== "owner") {
        return res.status(403).json({ error: "Only team owners can create invites" });
      }
      
      const inviteCode = nanoid(10);
      
      const invite = await storage.createTeamInvite({
        teamId,
        inviteCode,
        createdBy: userId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      
      res.json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(400).json({ error: "Invalid invite data" });
    }
  });

  app.get("/api/invites/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const invite = await storage.getTeamInviteByCode(code);
      
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }
      
      if (invite.usedBy) {
        return res.status(400).json({ error: "Invite already used" });
      }
      
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Invite expired" });
      }
      
      const team = await storage.getTeam(invite.teamId);
      const inviter = await storage.getUser(invite.createdBy);
      
      res.json({
        ...invite,
        teamName: team?.name || "Unknown Team",
        inviterUsername: inviter?.username || "Unknown",
      });
    } catch (error) {
      console.error("Error fetching invite:", error);
      res.status(500).json({ error: "Failed to fetch invite" });
    }
  });

  app.post("/api/invites/:code/accept", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { code } = req.params;
      const userId = (req.user as any).id;
      const { consentGiven } = req.body;
      
      if (typeof consentGiven !== "boolean") {
        return res.status(400).json({ error: "consentGiven is required" });
      }
      
      const invite = await storage.getTeamInviteByCode(code);
      
      if (!invite) {
        return res.status(404).json({ error: "Invite not found" });
      }
      
      if (invite.usedBy) {
        return res.status(400).json({ error: "Invite already used" });
      }
      
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Invite expired" });
      }
      
      const existingMember = await storage.getTeamMember(invite.teamId, userId);
      if (existingMember) {
        return res.status(400).json({ error: "Already a member of this team" });
      }
      
      await storage.addTeamMember({
        teamId: invite.teamId,
        userId,
        role: "member",
        consentGiven,
        consentDate: consentGiven ? new Date() : undefined,
      });
      
      await storage.useTeamInvite(code, userId);
      
      const team = await storage.getTeam(invite.teamId);
      
      res.json({ 
        success: true, 
        team,
        message: "Successfully joined team" 
      });
    } catch (error) {
      console.error("Error accepting invite:", error);
      res.status(500).json({ error: "Failed to accept invite" });
    }
  });

  app.get("/api/teams/:teamId/invites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { teamId } = req.params;
      const userId = (req.user as any).id;
      
      const member = await storage.getTeamMember(teamId, userId);
      if (!member || member.role !== "owner") {
        return res.status(403).json({ error: "Only team owners can view invites" });
      }
      
      const invites = await storage.getTeamInvites(teamId);
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  app.delete("/api/invites/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      await storage.deleteTeamInvite(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invite:", error);
      res.status(500).json({ error: "Failed to delete invite" });
    }
  });

  // ========================
  // Friend System Endpoints
  // ========================

  // Get or create user's unique invite code
  app.get("/api/friends/invite-code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      
      // Check if user already has an invite code
      const existing = await db.select().from(userInviteCodes).where(eq(userInviteCodes.userId, userId));
      
      if (existing.length > 0) {
        return res.json({ inviteCode: existing[0].inviteCode });
      }
      
      // Create a new unique invite code
      const inviteCode = nanoid(8);
      await db.insert(userInviteCodes).values({
        userId,
        inviteCode,
      });
      
      res.json({ inviteCode });
    } catch (error) {
      console.error("Error getting invite code:", error);
      res.status(500).json({ error: "Failed to get invite code" });
    }
  });

  // Accept a friend invite
  app.post("/api/friends/accept/:code", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { code } = req.params;
      const userId = (req.user as any).id;
      
      // Find the invite code owner
      const inviteRecord = await db.select().from(userInviteCodes).where(eq(userInviteCodes.inviteCode, code));
      
      if (inviteRecord.length === 0) {
        return res.status(404).json({ error: "Invalid invite code" });
      }
      
      const friendId = inviteRecord[0].userId;
      
      // Can't add yourself as a friend
      if (friendId === userId) {
        return res.status(400).json({ error: "You cannot add yourself as a friend" });
      }
      
      // Check if already friends (in either direction)
      const existingFriendship = await db.select().from(friendships)
        .where(
          or(
            and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
            and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
          )
        );
      
      if (existingFriendship.length > 0) {
        return res.status(400).json({ error: "Already friends with this user" });
      }
      
      // Create bidirectional friendship
      await db.insert(friendships).values([
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ]);
      
      // Get friend's username
      const friend = await storage.getUser(friendId);
      
      res.json({ 
        success: true, 
        message: `You are now friends with ${friend?.username || 'this user'}`,
        friendUsername: friend?.username,
      });
    } catch (error) {
      console.error("Error accepting friend invite:", error);
      res.status(500).json({ error: "Failed to accept friend invite" });
    }
  });

  // Get user's friends list with their gamification data
  app.get("/api/friends", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      
      // Get all friendships for this user
      const userFriendships = await db.select().from(friendships).where(eq(friendships.userId, userId));
      
      // Get friend details with gamification data
      const friendsData = await Promise.all(
        userFriendships.map(async (friendship) => {
          const friend = await storage.getUser(friendship.friendId);
          const gamification = await storage.getUserGamification(friendship.friendId);
          const xpData = await storage.getUserXp(friendship.friendId);
          const profile = await storage.getUserProfile(friendship.friendId);
          
          const level = xpData ? calculateLevelFromXP(xpData.totalXp) : 1;
          return {
            id: friendship.friendId,
            username: friend?.username || 'Unknown',
            xp: xpData?.totalXp || 0,
            level,
            currentStreak: gamification?.currentStreak || 0,
            profilePhoto: profile?.profilePhoto || null,
          };
        })
      );
      
      // Sort by XP (highest first)
      friendsData.sort((a, b) => b.xp - a.xp);
      
      res.json(friendsData);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  // Remove a friend
  app.delete("/api/friends/:friendId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const { friendId } = req.params;
      
      // Delete both directions of the friendship
      await db.delete(friendships).where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  // ========================
  // Onboarding Progress Endpoints
  // ========================

  app.get("/api/onboarding-progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const progress = await storage.getOnboardingProgress(userId);
      
      if (!progress) {
        return res.status(404).json({ error: "Onboarding progress not found" });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching onboarding progress:", error);
      res.status(500).json({ error: "Failed to fetch onboarding progress" });
    }
  });

  app.post("/api/onboarding-progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const userId = (req.user as any).id;
      const rawData = req.body;
      
      const updateData: Record<string, any> = {};
      if (rawData.consentCompleted !== undefined) updateData.consentCompleted = rawData.consentCompleted;
      if (rawData.consentCompletedAt) updateData.consentCompletedAt = new Date(rawData.consentCompletedAt);
      if (rawData.questionnaireCompleted !== undefined) updateData.questionnaireCompleted = rawData.questionnaireCompleted;
      if (rawData.questionnaireCompletedAt) updateData.questionnaireCompletedAt = new Date(rawData.questionnaireCompletedAt);
      if (rawData.onboardingComplete !== undefined) updateData.onboardingComplete = rawData.onboardingComplete;
      if (rawData.onboardingCompletedAt) updateData.onboardingCompletedAt = new Date(rawData.onboardingCompletedAt);
      if (rawData.accountCreated !== undefined) updateData.accountCreated = rawData.accountCreated;
      if (rawData.accountCreatedAt) updateData.accountCreatedAt = new Date(rawData.accountCreatedAt);
      
      let progress = await storage.getOnboardingProgress(userId);
      
      if (!progress) {
        progress = await storage.createOnboardingProgress(userId);
      }
      
      let xpAwarded = 0;
      let achievementsUnlocked: string[] = [];
      
      if (rawData.consentCompleted && !progress.consentCompleted) {
        const reward = getXPRewardAmount('consent_completed');
        const xpResult = await addXPAndCheckAchievements(userId, reward);
        xpAwarded += reward + xpResult.bonusXp;
        achievementsUnlocked.push(...xpResult.achievementsUnlocked);
      }
      
      if (rawData.questionnaireCompleted && !progress.questionnaireCompleted) {
        const reward = getXPRewardAmount('questionnaire_completed');
        const xpResult = await addXPAndCheckAchievements(userId, reward);
        xpAwarded += reward + xpResult.bonusXp;
        achievementsUnlocked.push(...xpResult.achievementsUnlocked);
      }
      
      const updated = await storage.updateOnboardingProgress(userId, updateData);
      res.json({ ...updated, xpAwarded, achievementsUnlocked });
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ error: "Failed to update onboarding progress" });
    }
  });

  // ========================
  // Weather & Outdoor Activity Endpoints
  // ========================

  app.get("/api/weather/outdoor-assessment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    try {
      const { latitude, longitude } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ error: "Coordinates out of range" });
      }
      
      const { getOutdoorActivityAssessment } = await import('./services/weatherService');
      const assessment = await getOutdoorActivityAssessment(lat, lon);
      
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching weather assessment:", error);
      res.status(500).json({ error: "Failed to fetch weather assessment" });
    }
  });

  // ========================
  // Feedback Endpoints
  // ========================

  app.post("/api/feedback", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const { subject, message, category } = req.body;
      
      if (!subject || !message) {
        return res.status(400).json({ error: "Subject and message are required" });
      }
      
      if (subject.length > 200) {
        return res.status(400).json({ error: "Subject must be less than 200 characters" });
      }
      
      if (message.length > 5000) {
        return res.status(400).json({ error: "Message must be less than 5000 characters" });
      }
      
      const user = req.user as any;
      const userEmail = user.email || 'No email provided';
      const username = user.username || 'unknown';
      const firstName = user.firstName || '';
      
      // Save feedback to database
      await storage.createFeedback({
        userId: user.id,
        username: username,
        email: userEmail,
        category: category || 'general',
        subject,
        message,
        status: 'new',
      });
      
      // Also send email notification (optional, can fail silently)
      try {
        await sendFeedbackEmail(
          username,
          firstName,
          userEmail,
          subject,
          message,
          category || 'general'
        );
      } catch (emailError) {
        console.error("Failed to send feedback email notification:", emailError);
        // Continue - we saved to database successfully
      }
      
      // Send thank you email to the user
      try {
        await sendFeedbackThankYouEmail(userEmail, firstName);
      } catch (thankYouError) {
        console.error("Failed to send feedback thank you email:", thankYouError);
        // Continue - this is not critical
      }
      
      res.json({ success: true, message: "Feedback submitted successfully" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Admin endpoints for feedback management
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'loretta-admin-2026';

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, token: Buffer.from(`admin:${Date.now()}`).toString('base64') });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.get("/api/admin/feedback", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (!decoded.startsWith('admin:')) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    storage.getAllFeedback().then(feedback => {
      res.json(feedback);
    }).catch(error => {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    });
  });

  app.patch("/api/admin/feedback/:id", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (!decoded.startsWith('admin:')) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    const { status } = req.body;
    if (!['new', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    storage.updateFeedbackStatus(req.params.id, status).then(feedback => {
      if (feedback) {
        res.json(feedback);
      } else {
        res.status(404).json({ error: "Feedback not found" });
      }
    }).catch(error => {
      console.error("Error updating feedback:", error);
      res.status(500).json({ error: "Failed to update feedback" });
    });
  });

  app.delete("/api/admin/feedback/:id", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (!decoded.startsWith('admin:')) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    storage.deleteFeedback(req.params.id).then(() => {
      res.json({ success: true });
    }).catch(error => {
      console.error("Error deleting feedback:", error);
      res.status(500).json({ error: "Failed to delete feedback" });
    });
  });

  app.delete("/api/admin/users/:userId", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (!decoded.startsWith('admin:')) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    const { userId } = req.params;
    
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const result = await storage.deleteUserCompletely(userId);
      console.log(`[Admin] Deleted user ${userId} (${user.username}), cleaned tables: ${result.deletedTables.join(', ')}`);
      res.json({ success: true, deletedTables: result.deletedTables, username: user.username });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (!decoded.startsWith('admin:')) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        emailVerified: users.emailVerified,
        firstName: users.firstName,
        lastName: users.lastName,
      }).from(users);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // ========================
  // Calendar Events Endpoints
  // ========================

  // Get all calendar events for the authenticated user
  app.get("/api/calendar-events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const events = await storage.getCalendarEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  // Get calendar events for a date range
  app.get("/api/calendar-events/range", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      
      const events = await storage.getCalendarEventsByDateRange(
        userId, 
        startDate as string, 
        endDate as string
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events by range:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  // Create a new calendar event
  app.post("/api/calendar-events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const { title, dateISO, startTime, endTime, notes, type } = req.body;
      
      if (!title || !dateISO || !startTime || !endTime) {
        return res.status(400).json({ error: "title, dateISO, startTime, and endTime are required" });
      }
      
      const event = await storage.createCalendarEvent({
        userId,
        title,
        dateISO,
        startTime,
        endTime,
        notes: notes || null,
        type: type || 'other',
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });

  // Update a calendar event
  app.put("/api/calendar-events/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const eventId = req.params.id;
      const updates = req.body;
      
      const updated = await storage.updateCalendarEvent(eventId, userId, updates);
      
      if (!updated) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ error: "Failed to update calendar event" });
    }
  });

  // Delete a calendar event
  app.delete("/api/calendar-events/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = (req.user as any).id;
      const eventId = req.params.id;
      
      await storage.deleteCalendarEvent(eventId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ error: "Failed to delete calendar event" });
    }
  });

  const httpServer = createServer(app);

  startMedicationAutoMissCron();

  return httpServer;
}

// Helper function to safely parse numeric values from answers
function parseNumeric(value: string | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Calculate BMI from height (cm) and weight (kg) - metric formula
function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}


interface RiskFactor {
  id: string;
  name: string;
  description: string;
  type: 'negative' | 'warning' | 'positive';
  icon: string;
}

function calculateRiskFactors(answers: Record<string, string>): RiskFactor[] {
  const factors: RiskFactor[] = [];
  
  // =============================================
  // ML MODEL FEATURE CATEGORIES (NHANES-based)
  // All factors below correspond to actual ML model features
  // =============================================
  
  // === PHYSICAL MEASUREMENTS (WHD010, WHD020, WHD050) ===
  const heightCm = parseNumeric(answers.height || answers.WHD010);
  const weightKg = parseNumeric(answers.weight_current || answers.WHD020 || answers.weight);
  const bmi = calculateBMI(heightCm, weightKg);
  
  if (bmi > 0) {
    let bmiDescription = '';
    let bmiType: 'negative' | 'warning' | 'positive' = 'positive';
    
    if (bmi < 18.5) {
      bmiDescription = `Underweight (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'warning';
    } else if (bmi < 25) {
      bmiDescription = `Normal weight (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'positive';
    } else if (bmi < 30) {
      bmiDescription = `Overweight (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'warning';
    } else if (bmi < 35) {
      bmiDescription = `Obesity Class I (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'negative';
    } else if (bmi < 40) {
      bmiDescription = `Obesity Class II (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'negative';
    } else {
      bmiDescription = `Obesity Class III (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'negative';
    }
    
    factors.push({
      id: 'bmi',
      name: 'Body Mass Index',
      description: bmiDescription,
      type: bmiType,
      icon: 'scale',
    });
  }
  
  // Weight change (WHD020 vs WHD050)
  const weightOneYearAgo = parseNumeric(answers.weight_year_ago || answers.WHD050);
  if (weightOneYearAgo > 0 && weightKg > 0) {
    const weightGainKg = weightKg - weightOneYearAgo;
    if (weightGainKg >= 10) {
      factors.push({
        id: 'weight-gain',
        name: 'Significant Weight Gain',
        description: `Gained ${weightGainKg.toFixed(1)} kg in the past year`,
        type: 'negative',
        icon: 'trending-up',
      });
    } else if (weightGainKg >= 5) {
      factors.push({
        id: 'weight-gain',
        name: 'Moderate Weight Gain',
        description: `Gained ${weightGainKg.toFixed(1)} kg in the past year`,
        type: 'warning',
        icon: 'trending-up',
      });
    } else if (weightGainKg <= -5) {
      factors.push({
        id: 'weight-loss',
        name: 'Weight Loss',
        description: `Lost ${Math.abs(weightGainKg).toFixed(1)} kg in the past year`,
        type: 'positive',
        icon: 'trending-down',
      });
    }
  }
  
  // === HEALTH CONDITIONS (ML Features: BPQ020, BPQ080, MCQ160A/B/C/E, KIQ022, MCQ560) ===
  
  // High blood pressure (BPQ020)
  const hasHighBP = answers.BPQ020 === '1' || answers.high_blood_pressure === 'yes';
  if (hasHighBP) {
    factors.push({
      id: 'high-bp',
      name: 'High Blood Pressure',
      description: 'Ever told you had high blood pressure: Yes',
      type: 'negative',
      icon: 'heart-pulse',
    });
  }
  
  // High cholesterol (BPQ080)
  const hasHighCholesterol = answers.BPQ080 === '1' || answers.high_cholesterol === 'yes';
  if (hasHighCholesterol) {
    factors.push({
      id: 'high-cholesterol',
      name: 'High Cholesterol',
      description: 'Doctor told you have high cholesterol: Yes',
      type: 'negative',
      icon: 'activity',
    });
  }
  
  // Arthritis (MCQ160A) - Note: This is arthritis, NOT heart attack
  const hasArthritis = answers.MCQ160A === '1' || answers.arthritis === 'yes';
  if (hasArthritis) {
    factors.push({
      id: 'arthritis',
      name: 'Arthritis',
      description: 'Doctor ever said you had arthritis: Yes',
      type: 'warning',
      icon: 'footprints',
    });
  }
  
  // Heart failure (MCQ160B)
  const hasHeartFailure = answers.MCQ160B === '1' || answers.heart_failure === 'yes';
  if (hasHeartFailure) {
    factors.push({
      id: 'heart-failure',
      name: 'Heart Failure',
      description: 'Ever told you had congestive heart failure: Yes',
      type: 'negative',
      icon: 'heart-off',
    });
  }
  
  // Coronary heart disease (MCQ160C)
  const hasCoronaryDisease = answers.MCQ160C === '1' || answers.coronary_disease === 'yes';
  if (hasCoronaryDisease) {
    factors.push({
      id: 'coronary-disease',
      name: 'Coronary Heart Disease',
      description: 'Ever told you had coronary heart disease: Yes',
      type: 'negative',
      icon: 'heart',
    });
  }
  
  // Heart attack (MCQ160E)
  const hadHeartAttack = answers.MCQ160E === '1' || answers.heart_attack === 'yes';
  if (hadHeartAttack) {
    factors.push({
      id: 'heart-attack',
      name: 'Previous Heart Attack',
      description: 'Ever told you had a heart attack: Yes',
      type: 'negative',
      icon: 'heart-crack',
    });
  }
  
  // Kidney disease (KIQ022)
  const hasKidneyDisease = answers.KIQ022 === '1' || answers.kidney_problems === 'yes';
  if (hasKidneyDisease) {
    factors.push({
      id: 'kidney-disease',
      name: 'Kidney Disease',
      description: 'Ever told you had weak/failing kidneys: Yes',
      type: 'negative',
      icon: 'kidney',
    });
  }
  
  // Gallbladder surgery (MCQ560)
  const hadGallbladderSurgery = answers.MCQ560 === '1' || answers.gallbladder_surgery === 'yes';
  if (hadGallbladderSurgery) {
    factors.push({
      id: 'gallbladder-surgery',
      name: 'Gallbladder Surgery',
      description: 'Ever had gallbladder surgery: Yes',
      type: 'warning',
      icon: 'pill',
    });
  }
  
  // === LIFESTYLE & ACTIVITY (ML Features: PAD790, PAD680, ALQ121) ===
  const moderateActivity = parseNumeric(answers.PAD790 || answers.moderate_activity);
  const sedentaryHours = parseNumeric(answers.PAD680 || answers.sedentary_hours);
  
  if (moderateActivity >= 5) {
    factors.push({
      id: 'activity',
      name: 'Very Active Lifestyle',
      description: `Moderate activity hours/week: ${moderateActivity}+`,
      type: 'positive',
      icon: 'dumbbell',
    });
  } else if (moderateActivity >= 2.5) {
    factors.push({
      id: 'activity',
      name: 'Active Lifestyle',
      description: `Moderate activity hours/week: ${moderateActivity}`,
      type: 'positive',
      icon: 'dumbbell',
    });
  } else if (moderateActivity >= 1) {
    factors.push({
      id: 'activity',
      name: 'Limited Physical Activity',
      description: `Moderate activity hours/week: ${moderateActivity}`,
      type: 'warning',
      icon: 'dumbbell',
    });
  } else if (moderateActivity === 0 || answers.PAD790 || answers.moderate_activity) {
    factors.push({
      id: 'activity',
      name: 'Sedentary Lifestyle',
      description: 'Moderate activity hours/week: 0',
      type: 'negative',
      icon: 'dumbbell',
    });
  }
  
  if (sedentaryHours >= 10) {
    factors.push({
      id: 'sedentary',
      name: 'Highly Sedentary',
      description: `Sedentary hours/day: ${sedentaryHours}+`,
      type: 'negative',
      icon: 'armchair',
    });
  } else if (sedentaryHours >= 8) {
    factors.push({
      id: 'sedentary',
      name: 'Extended Sitting Time',
      description: `Sedentary hours/day: ${sedentaryHours}`,
      type: 'warning',
      icon: 'armchair',
    });
  } else if (sedentaryHours > 0 && sedentaryHours < 6) {
    factors.push({
      id: 'sedentary',
      name: 'Low Sedentary Time',
      description: `Sedentary hours/day: ${sedentaryHours}`,
      type: 'positive',
      icon: 'armchair',
    });
  }
  
  // Alcohol consumption (ALQ121)
  // Questionnaire values: never, every_day, nearly_every_day, 3_4_week, 2_week, 1_week, 2_3_month, 1_month, 7_11_year, 3_6_year, 1_2_year
  const alcoholFreq = answers.ALQ121 || answers.alcohol_frequency;
  if (alcoholFreq === 'every_day' || alcoholFreq === 'nearly_every_day' || alcoholFreq === '1' || alcoholFreq === '2') {
    factors.push({
      id: 'alcohol',
      name: 'Daily Alcohol Consumption',
      description: 'Alcohol frequency: Every day or nearly every day',
      type: 'negative',
      icon: 'wine',
    });
  } else if (alcoholFreq === '3_4_week' || alcoholFreq === '2_week' || alcoholFreq === '1_week' || 
             alcoholFreq === '3' || alcoholFreq === '4' || alcoholFreq === '5') {
    factors.push({
      id: 'alcohol',
      name: 'Regular Alcohol Consumption',
      description: 'Alcohol frequency: 1-4 times per week',
      type: 'warning',
      icon: 'wine',
    });
  } else if (alcoholFreq === 'never' || alcoholFreq === '0') {
    factors.push({
      id: 'alcohol',
      name: 'No Alcohol',
      description: 'Alcohol frequency: Never in the past year',
      type: 'positive',
      icon: 'wine',
    });
  } else if (alcoholFreq === '2_3_month' || alcoholFreq === '1_month' || alcoholFreq === '7_11_year' || 
             alcoholFreq === '3_6_year' || alcoholFreq === '1_2_year' ||
             alcoholFreq === '6' || alcoholFreq === '7' || alcoholFreq === '8' || alcoholFreq === '9' || alcoholFreq === '10') {
    factors.push({
      id: 'alcohol',
      name: 'Occasional Alcohol',
      description: 'Alcohol frequency: Monthly or less',
      type: 'positive',
      icon: 'wine',
    });
  }
  
  // === SLEEP (ML Features: SLD012, SLD013, DPQ030) ===
  const weekdaySleep = parseNumeric(answers.SLD012 || answers.weekday_sleep, 0);
  const weekendSleep = parseNumeric(answers.SLD013 || answers.weekend_sleep, 0);
  const avgSleep = weekdaySleep > 0 && weekendSleep > 0 
    ? (weekdaySleep + weekendSleep) / 2 
    : weekdaySleep > 0 ? weekdaySleep : weekendSleep;
  
  if (avgSleep > 0) {
    let sleepType: 'negative' | 'warning' | 'positive' = 'positive';
    let sleepDescription = '';
    
    if (avgSleep < 5) {
      sleepType = 'negative';
      sleepDescription = `Sleep hours per night: ${avgSleep.toFixed(1)} (severe deprivation)`;
    } else if (avgSleep < 6) {
      sleepType = 'negative';
      sleepDescription = `Sleep hours per night: ${avgSleep.toFixed(1)} (deprived)`;
    } else if (avgSleep < 7) {
      sleepType = 'warning';
      sleepDescription = `Sleep hours per night: ${avgSleep.toFixed(1)} (slightly low)`;
    } else if (avgSleep <= 9) {
      sleepType = 'positive';
      sleepDescription = `Sleep hours per night: ${avgSleep.toFixed(1)} (optimal)`;
    } else {
      sleepType = 'warning';
      sleepDescription = `Sleep hours per night: ${avgSleep.toFixed(1)} (excessive)`;
    }
    
    factors.push({
      id: 'sleep',
      name: 'Sleep Duration',
      description: sleepDescription,
      type: sleepType,
      icon: 'moon',
    });
  }
  
  // Sleep trouble (DPQ030)
  // Questionnaire values: not_at_all, several_days, more_than_half, nearly_every_day
  const sleepTrouble = answers.DPQ030 || answers.sleep_trouble;
  if (sleepTrouble === 'nearly_every_day' || sleepTrouble === '3') {
    factors.push({
      id: 'sleep-trouble',
      name: 'Severe Sleep Difficulties',
      description: 'Trouble sleeping or sleeping too much: Nearly every day',
      type: 'negative',
      icon: 'moon',
    });
  } else if (sleepTrouble === 'more_than_half' || sleepTrouble === '2') {
    factors.push({
      id: 'sleep-trouble',
      name: 'Frequent Sleep Difficulties',
      description: 'Trouble sleeping or sleeping too much: More than half the days',
      type: 'warning',
      icon: 'moon',
    });
  } else if (sleepTrouble === 'several_days' || sleepTrouble === '1') {
    factors.push({
      id: 'sleep-trouble',
      name: 'Occasional Sleep Difficulties',
      description: 'Trouble sleeping or sleeping too much: Several days',
      type: 'warning',
      icon: 'moon',
    });
  } else if (sleepTrouble === 'not_at_all' || sleepTrouble === '0') {
    factors.push({
      id: 'sleep-trouble',
      name: 'Good Sleep Quality',
      description: 'Trouble sleeping or sleeping too much: Not at all',
      type: 'positive',
      icon: 'moon',
    });
  }
  
  // === BALANCE/MOBILITY (ML Features: BAQ321C, BAQ530 ONLY) ===
  // Note: BAQ061 and BAQ161B are NOT in the ML model
  const hasUnsteadiness = answers.BAQ321C === '1' || answers.unsteadiness === 'yes';
  const fallsAnswer = answers.BAQ530 || answers.falls;
  // Questionnaire stores: 'never', '1_2', '3_4', 'yearly', 'monthly', 'weekly', 'daily'
  // Or numeric API values: '0'=never, '1'=1-2 times, '2'=3-4 times, '3'=yearly, '4'=monthly, '5'=weekly, '6'=daily
  const hadFalls = fallsAnswer === '1' || fallsAnswer === '2' || fallsAnswer === '3' || 
                   fallsAnswer === '1_2' || fallsAnswer === '3_4' || fallsAnswer === 'yearly';
  const frequentFalls = fallsAnswer === '4' || fallsAnswer === '5' || fallsAnswer === '6' ||
                        fallsAnswer === 'monthly' || fallsAnswer === 'weekly' || fallsAnswer === 'daily';
  
  // Get human-readable fall frequency
  const getFallFrequency = (answer: string | undefined): string => {
    if (!answer) return 'Not specified';
    const map: Record<string, string> = {
      '0': 'Never', 'never': 'Never',
      '1': '1 or 2 times', '1_2': '1 or 2 times',
      '2': '3 to 4 times', '3_4': '3 to 4 times',
      '3': 'About every year', 'yearly': 'About every year',
      '4': 'About every month', 'monthly': 'About every month',
      '5': 'About every week', 'weekly': 'About every week',
      '6': 'Daily or constantly', 'daily': 'Daily or constantly',
    };
    return map[answer] || answer;
  };
  
  if (frequentFalls) {
    factors.push({
      id: 'balance',
      name: 'Frequent Falls',
      description: `Falls in past 5 years: ${getFallFrequency(fallsAnswer)}`,
      type: 'negative',
      icon: 'footprints',
    });
  } else if (hasUnsteadiness && hadFalls) {
    factors.push({
      id: 'balance',
      name: 'Balance/Fall Concerns',
      description: `Problems with unsteadiness: Yes | Falls in past 5 years: ${getFallFrequency(fallsAnswer)}`,
      type: 'warning',
      icon: 'footprints',
    });
  } else if (hasUnsteadiness) {
    factors.push({
      id: 'balance',
      name: 'Balance/Mobility Concern',
      description: 'Problems with unsteadiness in past 12 months: Yes',
      type: 'warning',
      icon: 'footprints',
    });
  } else if (hadFalls) {
    factors.push({
      id: 'balance',
      name: 'Balance/Mobility Concern',
      description: `Falls in past 5 years: ${getFallFrequency(fallsAnswer)}`,
      type: 'warning',
      icon: 'footprints',
    });
  }
  
  // === ORAL HEALTH (ML Features: OHQ845, OHQ620, OHQ630, OHQ660, OHQ670) ===
  // IMPORTANT: These features measure mouth problems, NOT gum disease/loose teeth/bone loss
  // OHQ620 = "How often had aching in mouth?" (very_often=0, fairly_often=1, occasionally=2, hardly_ever=3, never=4)
  // OHQ630 = "How often felt bad because of mouth?" (same scale)
  // OHQ660 = "Avoid food because of mouth" (same scale)
  // OHQ670 = "Couldn't eat because of mouth" (same scale)
  // OHQ845 = "Rate teeth and gums health" (excellent=0, very_good=1, good=2, fair=3, poor=4)
  
  const mouthAching = answers.OHQ620 || answers.mouth_aching;
  const mouthFeelBad = answers.OHQ630 || answers.mouth_feel_bad;
  const mouthAvoidFood = answers.OHQ660 || answers.mouth_avoid_food;
  const mouthEatingProblems = answers.OHQ670 || answers.mouth_eating_problems;
  const dentalHealthRating = answers.OHQ845 || answers.dental_health;
  
  // Count frequent mouth problems (very_often or fairly_often = serious issue)
  const frequentMouthAching = mouthAching === '0' || mouthAching === '1' || mouthAching === 'very_often' || mouthAching === 'fairly_often';
  const frequentFeelBad = mouthFeelBad === '0' || mouthFeelBad === '1' || mouthFeelBad === 'very_often' || mouthFeelBad === 'fairly_often';
  const frequentAvoidFood = mouthAvoidFood === '0' || mouthAvoidFood === '1' || mouthAvoidFood === 'very_often' || mouthAvoidFood === 'fairly_often';
  const frequentEatingProblems = mouthEatingProblems === '0' || mouthEatingProblems === '1' || mouthEatingProblems === 'very_often' || mouthEatingProblems === 'fairly_often';
  const poorDentalRating = dentalHealthRating === '3' || dentalHealthRating === '4' || dentalHealthRating === 'fair' || dentalHealthRating === 'poor';
  const goodDentalRating = dentalHealthRating === '0' || dentalHealthRating === '1' || dentalHealthRating === 'excellent' || dentalHealthRating === 'very_good';
  
  const mouthProblemCount = [frequentMouthAching, frequentFeelBad, frequentAvoidFood, frequentEatingProblems].filter(Boolean).length;
  
  // Get human-readable dental health rating
  const getDentalRating = (answer: string | undefined): string => {
    if (!answer) return 'Not specified';
    const map: Record<string, string> = {
      '0': 'Excellent', 'excellent': 'Excellent',
      '1': 'Very good', 'very_good': 'Very good',
      '2': 'Good', 'good': 'Good',
      '3': 'Fair', 'fair': 'Fair',
      '4': 'Poor', 'poor': 'Poor',
    };
    return map[answer] || answer;
  };
  
  if (mouthProblemCount >= 3 || (poorDentalRating && mouthProblemCount >= 2)) {
    factors.push({
      id: 'oral-health',
      name: 'Significant Oral Health Issues',
      description: `Rate health of teeth and gums: ${getDentalRating(dentalHealthRating)} | Multiple mouth problems reported`,
      type: 'negative',
      icon: 'smile',
    });
  } else if (mouthProblemCount >= 1 || poorDentalRating) {
    factors.push({
      id: 'oral-health',
      name: 'Oral Health Concerns',
      description: `Rate health of teeth and gums: ${getDentalRating(dentalHealthRating)}`,
      type: 'warning',
      icon: 'smile',
    });
  } else if (goodDentalRating) {
    factors.push({
      id: 'oral-health',
      name: 'Good Oral Health',
      description: `Rate health of teeth and gums: ${getDentalRating(dentalHealthRating)}`,
      type: 'positive',
      icon: 'smile',
    });
  }
  
  // === GENERAL HEALTH (ML Features: HUQ010, HUQ030, HUQ055) ===
  const generalHealth = answers.HUQ010 || answers.general_health;
  const getGeneralHealthRating = (answer: string | undefined): string => {
    if (!answer) return 'Not specified';
    const map: Record<string, string> = {
      '0': 'Excellent', 'excellent': 'Excellent',
      '1': 'Very good', 'very_good': 'Very good',
      '2': 'Good', 'good': 'Good',
      '3': 'Fair', 'fair': 'Fair',
      '4': 'Poor', 'poor': 'Poor',
    };
    return map[answer] || answer;
  };
  
  if (generalHealth === '3' || generalHealth === 'fair') {
    factors.push({
      id: 'general-health',
      name: 'General Health Condition',
      description: `General health condition: ${getGeneralHealthRating(generalHealth)}`,
      type: 'warning',
      icon: 'user',
    });
  } else if (generalHealth === '4' || generalHealth === 'poor') {
    factors.push({
      id: 'general-health',
      name: 'General Health Condition',
      description: `General health condition: ${getGeneralHealthRating(generalHealth)}`,
      type: 'negative',
      icon: 'user',
    });
  } else if (generalHealth === '0' || generalHealth === 'excellent') {
    factors.push({
      id: 'general-health',
      name: 'General Health Condition',
      description: `General health condition: ${getGeneralHealthRating(generalHealth)}`,
      type: 'positive',
      icon: 'user',
    });
  } else if (generalHealth === '1' || generalHealth === '2' || generalHealth === 'very_good' || generalHealth === 'good') {
    factors.push({
      id: 'general-health',
      name: 'General Health Condition',
      description: `General health condition: ${getGeneralHealthRating(generalHealth)}`,
      type: 'positive',
      icon: 'user',
    });
  }
  
  // Routine healthcare place (HUQ030)
  // Questionnaire values: yes, no, multiple
  const healthcarePlace = answers.HUQ030 || answers.routine_healthcare;
  if (healthcarePlace === 'yes' || healthcarePlace === 'multiple' || healthcarePlace === '0' || healthcarePlace === '2') {
    factors.push({
      id: 'healthcare-access',
      name: 'Healthcare Access',
      description: 'Routine place to go for healthcare: Yes',
      type: 'positive',
      icon: 'heart-pulse',
    });
  } else if (healthcarePlace === 'no' || healthcarePlace === '1') {
    factors.push({
      id: 'healthcare-access',
      name: 'No Regular Healthcare',
      description: 'Routine place to go for healthcare: No',
      type: 'warning',
      icon: 'heart-pulse',
    });
  }
  
  // === HEARING (ML Feature: AUQ054) ===
  // Questionnaire values: excellent, good, little_trouble, moderate, lot_trouble, deaf
  const hearingHealth = answers.AUQ054 || answers.hearing_health;
  if (hearingHealth === 'lot_trouble' || hearingHealth === 'deaf' || hearingHealth === '4' || hearingHealth === '5') {
    factors.push({
      id: 'hearing',
      name: 'Significant Hearing Issues',
      description: `Hearing condition: ${hearingHealth === 'deaf' || hearingHealth === '5' ? 'Deaf' : 'A lot of trouble'}`,
      type: 'negative',
      icon: 'ear',
    });
  } else if (hearingHealth === 'moderate' || hearingHealth === '3') {
    factors.push({
      id: 'hearing',
      name: 'Moderate Hearing Trouble',
      description: 'Hearing condition: Moderate trouble',
      type: 'warning',
      icon: 'ear',
    });
  } else if (hearingHealth === 'little_trouble' || hearingHealth === '2') {
    factors.push({
      id: 'hearing',
      name: 'Minor Hearing Concerns',
      description: 'Hearing condition: A little trouble',
      type: 'warning',
      icon: 'ear',
    });
  } else if (hearingHealth === 'excellent' || hearingHealth === 'good' || hearingHealth === '0' || hearingHealth === '1') {
    factors.push({
      id: 'hearing',
      name: 'Good Hearing',
      description: `Hearing condition: ${hearingHealth === 'excellent' || hearingHealth === '0' ? 'Excellent' : 'Good'}`,
      type: 'positive',
      icon: 'ear',
    });
  }
  
  // === MEDICATIONS (ML Feature: RXQ510) ===
  const takingAspirin = answers.RXQ510 === '1' || answers.daily_aspirin === 'yes';
  if (takingAspirin) {
    factors.push({
      id: 'aspirin',
      name: 'Daily Aspirin',
      description: 'Doctor told to take daily low-dose aspirin: Yes',
      type: 'warning',
      icon: 'pill',
    });
  }
  
  // Sort by name for consistent display
  factors.sort((a, b) => a.name.localeCompare(b.name));
  
  return factors;
}
