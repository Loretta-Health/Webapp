import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { userMissions } from "@shared/schema";
import { setupAuth } from "./auth";
import { HEALTH_NAVIGATOR_SYSTEM_PROMPT } from "./prompts";
import { XP_REWARDS, getXPRewardAmount, calculateLevelFromXP } from "./lib/xpManager";
import { processCheckin, processActivityLogged, processXpEarned, processMedicationTaken } from "./lib/achievementManager";
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

async function chatWithScaleway(messages: ChatMessage[]): Promise<string> {
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
      temperature: 0.7,
      max_tokens: 1000,
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
      const { messages } = req.body;
      
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

      const chatMessages: ChatMessage[] = [
        { role: "system", content: HEALTH_NAVIGATOR_SYSTEM_PROMPT },
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

  // ML Prediction API endpoint
  const PREDICTION_API_URL = process.env.PREDICTION_API_URL || 'https://loretta-ml-prediction-dev-5oc2gjs2kq-el.a.run.app/predict';
  
  app.post("/api/predict", async (req, res) => {
    const startTime = Date.now();
    const metadata: {
      method: 'ml_api' | 'error';
      success: boolean;
      ml_api_url: string;
      features_received: number;
      features_sent: { ID: string; Value: string }[];
      response_time_ms?: number;
      ml_response_status?: number;
      error_message?: string;
      error_details?: string;
    } = {
      method: 'ml_api',
      success: false,
      ml_api_url: PREDICTION_API_URL,
      features_received: 0,
      features_sent: [],
    };
    
    try {
      const { features } = req.body;
      
      if (!features || !Array.isArray(features)) {
        metadata.error_message = 'Features array is required';
        return res.status(400).json({ 
          error: "Features array is required",
          _metadata: metadata
        });
      }

      metadata.features_received = features.length;
      metadata.features_sent = features;

      console.log('[Prediction API] Calling ML service with features:', JSON.stringify(features, null, 2));
      console.log('[Prediction API] ML API URL:', PREDICTION_API_URL);

      const response = await fetch(PREDICTION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
      });

      metadata.ml_response_status = response.status;
      metadata.response_time_ms = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Prediction API] Error from ML service:', response.status, errorText);
        metadata.error_message = 'ML service returned error';
        metadata.error_details = errorText;
        return res.status(response.status).json({ 
          error: "Prediction service error", 
          details: errorText,
          _metadata: metadata
        });
      }

      const prediction = await response.json();
      console.log('[Prediction API] Received prediction:', prediction);
      
      metadata.success = true;
      
      res.json({
        ...prediction,
        _metadata: metadata
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("[Prediction API] Error:", error);
      metadata.method = 'error';
      metadata.error_message = errorMessage;
      metadata.response_time_ms = Date.now() - startTime;
      res.status(500).json({ 
        error: "Failed to get prediction from ML service",
        _metadata: metadata
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
      
      // Automatically recalculate risk score when questionnaire is updated
      try {
        const allAnswers = await storage.getAllQuestionnaireAnswers(userId);
        const mergedAnswers: Record<string, string> = {};
        allAnswers.forEach(a => {
          Object.assign(mergedAnswers, a.answers);
        });
        
        // Also merge in profile data for comprehensive risk calculation
        const profile = await storage.getUserProfile(userId);
        if (profile) {
          if (profile.age && !mergedAnswers.age) mergedAnswers.age = profile.age;
          if (profile.height && !mergedAnswers.height) mergedAnswers.height = profile.height;
          if (profile.weight && !mergedAnswers.weight_current) mergedAnswers.weight_current = profile.weight;
        }
        
        const riskScore = calculateRiskScores(mergedAnswers);
        await storage.saveRiskScore({
          userId,
          ...riskScore,
        });
        console.log("[API] Risk score auto-recalculated after questionnaire update");
      } catch (riskError) {
        console.error("[API] Failed to auto-recalculate risk score:", riskError);
        // Don't fail the whole request if risk calculation fails
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
      
      // Automatically recalculate risk score when profile is updated with health-relevant data
      if (saved.age || saved.height || saved.weight) {
        try {
          const allAnswers = await storage.getAllQuestionnaireAnswers(userId);
          const mergedAnswers: Record<string, string> = {};
          allAnswers.forEach(a => {
            Object.assign(mergedAnswers, a.answers);
          });
          
          // Merge in profile data (profile takes precedence for these fields)
          if (saved.age) mergedAnswers.age = saved.age;
          if (saved.height) mergedAnswers.height = saved.height;
          if (saved.weight) mergedAnswers.weight_current = saved.weight;
          
          const riskScore = calculateRiskScores(mergedAnswers);
          await storage.saveRiskScore({
            userId,
            ...riskScore,
          });
          console.log("[API] Risk score auto-recalculated after profile update");
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
      
      res.json({
        ...gamification,
        xp,
        level,
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
    console.warn("[DEPRECATED] /api/risk-scores/calculate endpoint called - using legacy risk calculation as fallback");
    try {
      const userId = (req.user as any).id;
      
      const answers = await storage.getAllQuestionnaireAnswers(userId);
      
      const allAnswers: Record<string, string> = {};
      answers.forEach(a => {
        Object.assign(allAnswers, a.answers);
      });
      
      const riskScore = calculateRiskScores(allAnswers);
      
      const saved = await storage.saveRiskScore({
        userId,
        ...riskScore,
      });
      
      console.log("[DEPRECATED] Legacy risk calculation completed for user:", userId);
      res.json(saved);
    } catch (error) {
      console.error("[DEPRECATED] Error in legacy risk score calculation:", error);
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

  app.post("/api/missions/suggest", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = (req.user as any).id;
      const { context, language = 'en' } = req.body;

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
      const latestCheckin = await storage.getLatestEmotionalCheckin(userId);
      const isLowMood = latestCheckin && isLowMoodEmotion(latestCheckin.emotion);
      const today = new Date().toDateString();
      const checkinDate = latestCheckin?.checkedInAt ? new Date(latestCheckin.checkedInAt).toDateString() : null;
      const isCheckinToday = checkinDate === today;
      const shouldShowAlternative = isLowMood && isCheckinToday && !bestMission.isAlternative;
      
      let alternativeMission = null;
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
          reason = language === 'de' 
            ? 'Hier ist eine sanftere Alternative, die zu deiner aktuellen Stimmung passt.' 
            : 'Here\'s a gentler alternative that matches your current mood.';
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
        
        if (isLowMood && isCheckinToday && catalogMission && !catalogMission.isAlternative) {
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
      const validatedData = updateUserMissionSchema.parse(req.body);
      
      if (validatedData.isActive === true && !validatedData.activatedAt) {
        validatedData.activatedAt = new Date();
      }
      
      const updated = await storage.updateUserMission(id, validatedData);
      
      if (!updated) {
        return res.status(404).json({ error: "Mission not found" });
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
          
          const totalDosesTaken = adherence?.totalDosesTaken || 0;
          const totalDosesScheduled = adherence?.totalDosesScheduled || 0;
          const adherencePercent = totalDosesScheduled > 0 
            ? Math.round((totalDosesTaken / totalDosesScheduled) * 100)
            : 100;
          
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
      
      res.json({
        success: true,
        log,
        xpAwarded: 0,
        streak: adherence?.currentStreak || 1,
        achievementsUnlocked: [],
      });
    } catch (error) {
      console.error("Error logging medication dose:", error);
      res.status(500).json({ error: "Failed to log medication dose" });
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

  // Get the authenticated user's communities
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

  // Get current user's membership in Loretta community
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
          const xp = xpRecord?.totalXp || 0;
          const level = calculateLevelFromXP(xp);
          return {
            ...member,
            username: user?.username || "Unknown",
            xp,
            level,
            currentStreak: gamification?.currentStreak || 0,
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

  const httpServer = createServer(app);

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

// Get BMI category risk points (evidence-based from CDC/WHO guidelines)
function getBMIRiskPoints(bmi: number): { diabetes: number; heart: number; stroke: number } {
  if (bmi === 0) return { diabetes: 0, heart: 0, stroke: 0 };
  if (bmi < 18.5) return { diabetes: 5, heart: 5, stroke: 5 }; // Underweight - some risk
  if (bmi < 25) return { diabetes: 0, heart: 0, stroke: 0 }; // Normal - baseline
  if (bmi < 30) return { diabetes: 10, heart: 8, stroke: 6 }; // Overweight
  if (bmi < 35) return { diabetes: 18, heart: 15, stroke: 12 }; // Obese Class I
  if (bmi < 40) return { diabetes: 25, heart: 22, stroke: 18 }; // Obese Class II
  return { diabetes: 30, heart: 28, stroke: 22 }; // Obese Class III
}

// Get age-based risk points (risk increases with age, especially after 45)
function getAgeRiskPoints(age: number): { diabetes: number; heart: number; stroke: number } {
  if (age < 35) return { diabetes: 0, heart: 0, stroke: 0 };
  if (age < 45) return { diabetes: 5, heart: 5, stroke: 3 };
  if (age < 55) return { diabetes: 12, heart: 12, stroke: 8 };
  if (age < 65) return { diabetes: 18, heart: 18, stroke: 15 };
  if (age < 75) return { diabetes: 22, heart: 22, stroke: 22 };
  return { diabetes: 25, heart: 25, stroke: 28 }; // 75+
}

// Get activity level risk points (sedentary lifestyle is a major risk factor)
function getActivityRiskPoints(moderateHoursPerWeek: number, sedentaryHoursPerDay: number): { diabetes: number; heart: number; stroke: number } {
  let activityScore = 0;
  
  // Moderate activity (recommended: 2.5+ hours/week)
  if (moderateHoursPerWeek >= 5) activityScore -= 15; // Very active - protective
  else if (moderateHoursPerWeek >= 2.5) activityScore -= 8; // Meets guidelines
  else if (moderateHoursPerWeek >= 1) activityScore += 5; // Some activity
  else activityScore += 15; // Sedentary
  
  // Sedentary time (sitting >8 hours/day is risky)
  if (sedentaryHoursPerDay >= 10) activityScore += 12;
  else if (sedentaryHoursPerDay >= 8) activityScore += 8;
  else if (sedentaryHoursPerDay >= 6) activityScore += 4;
  
  const points = Math.max(0, activityScore);
  return { diabetes: points, heart: points, stroke: Math.round(points * 0.7) };
}

// Get sleep quality risk points (poor sleep correlates with metabolic and cardiovascular issues)
function getSleepRiskPoints(weekdayHours: number, weekendHours: number, hasSleepTrouble: boolean): { diabetes: number; heart: number; stroke: number } {
  const avgSleep = (weekdayHours + weekendHours) / 2;
  let sleepScore = 0;
  
  // Optimal sleep is 7-9 hours
  if (avgSleep < 5) sleepScore += 15; // Severe sleep deprivation
  else if (avgSleep < 6) sleepScore += 10; // Sleep deprived
  else if (avgSleep < 7) sleepScore += 5; // Slightly low
  else if (avgSleep <= 9) sleepScore += 0; // Optimal
  else sleepScore += 5; // Too much sleep can also indicate issues
  
  if (hasSleepTrouble) sleepScore += 8;
  
  return { diabetes: sleepScore, heart: sleepScore, stroke: Math.round(sleepScore * 0.8) };
}

// Improved risk score calculation using questionnaire data properly
function calculateRiskScores(answers: Record<string, string>): {
  overallScore: number;
  diabetesRisk: number;
  heartRisk: number;
  strokeRisk: number;
} {
  let diabetesRisk = 0;
  let heartRisk = 0;
  let strokeRisk = 0;
  
  // === BIOMETRIC FACTORS ===
  
  // BMI calculation from height (cm) and weight (kg)
  // Check multiple possible field names: question ID, apiId, or common name
  const heightCm = parseNumeric(answers.height || answers.WHD010);
  const weightKg = parseNumeric(answers.weight_current || answers.WHD020 || answers.weight);
  const bmi = calculateBMI(heightCm, weightKg);
  const bmiRisk = getBMIRiskPoints(bmi);
  diabetesRisk += bmiRisk.diabetes;
  heartRisk += bmiRisk.heart;
  strokeRisk += bmiRisk.stroke;
  
  // Weight change in past year (significant gain is a risk factor) - in kg
  const weightOneYearAgo = parseNumeric(answers.weight_year_ago || answers.WHD050);
  if (weightOneYearAgo > 0 && weightKg > 0) {
    const weightGainKg = weightKg - weightOneYearAgo;
    // ~10kg gain is significant, ~5kg is moderate
    if (weightGainKg >= 10) { diabetesRisk += 8; heartRisk += 6; }
    else if (weightGainKg >= 5) { diabetesRisk += 4; heartRisk += 3; }
  }
  
  // Age-based risk
  const age = parseNumeric(answers.RIDAGEYR || answers.age);
  const ageRisk = getAgeRiskPoints(age);
  diabetesRisk += ageRisk.diabetes;
  heartRisk += ageRisk.heart;
  strokeRisk += ageRisk.stroke;
  
  // === MEDICAL HISTORY (NHANES-style API IDs) ===
  
  // Diabetes/prediabetes (DIQ160 = prediabetes, DIQ180 = diabetes)
  const hasDiabetes = answers.DIQ180 === '1' || answers.diabetes === 'yes';
  const hasPrediabetes = answers.DIQ160 === '1' || answers.prediabetes === 'yes';
  if (hasDiabetes) {
    diabetesRisk += 40; // Already diagnosed
    heartRisk += 15; // Diabetes increases cardiovascular risk
    strokeRisk += 12;
  } else if (hasPrediabetes) {
    diabetesRisk += 25;
    heartRisk += 8;
    strokeRisk += 6;
  }
  
  // High blood pressure (BPQ020)
  const hasHighBP = answers.BPQ020 === '1' || answers.high_blood_pressure === 'yes';
  if (hasHighBP) {
    diabetesRisk += 8;
    heartRisk += 20; // Major heart risk factor
    strokeRisk += 25; // Major stroke risk factor
  }
  
  // High cholesterol (BPQ080)
  const hasHighCholesterol = answers.BPQ080 === '1' || answers.high_cholesterol === 'yes';
  if (hasHighCholesterol) {
    diabetesRisk += 5;
    heartRisk += 18;
    strokeRisk += 12;
  }
  
  // Cardiovascular history
  const hadHeartAttack = answers.MCQ160A === '1';
  const hasHeartFailure = answers.MCQ160B === '1';
  const hasCoronaryDisease = answers.MCQ160C === '1';
  const hadStroke = answers.MCQ160E === '1';
  
  if (hadHeartAttack) { heartRisk += 25; strokeRisk += 10; }
  if (hasHeartFailure) { heartRisk += 30; strokeRisk += 15; }
  if (hasCoronaryDisease) { heartRisk += 20; strokeRisk += 10; }
  if (hadStroke) { strokeRisk += 30; heartRisk += 10; }
  
  // Kidney disease (KIQ022) - linked to diabetes and heart disease
  const hasKidneyDisease = answers.KIQ022 === '1';
  if (hasKidneyDisease) {
    diabetesRisk += 12;
    heartRisk += 15;
    strokeRisk += 10;
  }
  
  // === LIFESTYLE FACTORS ===
  
  // Physical activity (PAD790 = moderate activity hours/week, PAD680 = sedentary hours/day)
  const moderateActivity = parseNumeric(answers.PAD790);
  const sedentaryHours = parseNumeric(answers.PAD680);
  const activityRisk = getActivityRiskPoints(moderateActivity, sedentaryHours);
  diabetesRisk += activityRisk.diabetes;
  heartRisk += activityRisk.heart;
  strokeRisk += activityRisk.stroke;
  
  // Sleep patterns (SLD012 = weekday hours, SLD013 = weekend hours, DPQ030 = sleep trouble)
  const weekdaySleep = parseNumeric(answers.SLD012, 7);
  const weekendSleep = parseNumeric(answers.SLD013, 7);
  const hasSleepTrouble = answers.DPQ030 === '1' || answers.DPQ030 === '2'; // 1=sometimes, 2=often
  const sleepRisk = getSleepRiskPoints(weekdaySleep, weekendSleep, hasSleepTrouble);
  diabetesRisk += sleepRisk.diabetes;
  heartRisk += sleepRisk.heart;
  strokeRisk += sleepRisk.stroke;
  
  // Alcohol consumption (ALQ121)
  const alcoholFreq = parseNumeric(answers.ALQ121);
  if (alcoholFreq >= 10) { // 10+ drinks per week
    heartRisk += 10;
    strokeRisk += 15;
  } else if (alcoholFreq >= 5) {
    heartRisk += 5;
    strokeRisk += 8;
  }
  
  // === BALANCE AND FALLS (indicators of overall health/frailty) ===
  const hasBalanceIssues = answers.BAQ321C === '1';
  const hasFalls = answers.BAQ530 === '1' || answers.BAQ530 === '2';
  if (hasBalanceIssues || hasFalls) {
    strokeRisk += 8; // Balance issues can indicate neurological risk
  }
  
  // === ORAL HEALTH (correlates with systemic inflammation and cardiovascular health) ===
  const poorDentalHealth = answers.OHQ845 === '4' || answers.OHQ845 === '5'; // Fair or Poor
  const hasGumDisease = answers.OHQ620 === '1';
  const hasLooseTeeth = answers.OHQ630 === '1';
  const hasBoneLoss = answers.OHQ660 === '1';
  
  const oralHealthIssues = [poorDentalHealth, hasGumDisease, hasLooseTeeth, hasBoneLoss].filter(Boolean).length;
  if (oralHealthIssues >= 3) {
    heartRisk += 10;
    diabetesRisk += 8;
  } else if (oralHealthIssues >= 1) {
    heartRisk += 5;
    diabetesRisk += 4;
  }
  
  // === GENERAL HEALTH SELF-ASSESSMENT ===
  const generalHealth = answers.HUQ010;
  if (generalHealth === '4' || generalHealth === '5') { // Fair or Poor
    diabetesRisk += 8;
    heartRisk += 8;
    strokeRisk += 8;
  } else if (generalHealth === '1') { // Excellent
    diabetesRisk -= 5;
    heartRisk -= 5;
    strokeRisk -= 5;
  }
  
  // === MEDICATIONS (can indicate managed conditions) ===
  const takingPrescriptions = answers.RXQ033 === '1';
  const takingAspirin = answers.RXQ510 === '1';
  
  // Taking aspirin may indicate preventive care for heart issues
  if (takingAspirin) {
    heartRisk += 5; // Already at risk if taking preventive aspirin
  }
  
  // === NORMALIZE SCORES ===
  // Ensure scores are within 0-100 range and apply reasonable caps
  diabetesRisk = Math.max(0, Math.min(100, diabetesRisk));
  heartRisk = Math.max(0, Math.min(100, heartRisk));
  strokeRisk = Math.max(0, Math.min(100, strokeRisk));
  
  // Apply a minimum baseline risk based on age if no other factors
  if (age >= 40 && diabetesRisk < 10) diabetesRisk = 10;
  if (age >= 50 && heartRisk < 10) heartRisk = 10;
  if (age >= 60 && strokeRisk < 10) strokeRisk = 10;
  
  // Calculate overall score (weighted average favoring highest risk)
  const maxRisk = Math.max(diabetesRisk, heartRisk, strokeRisk);
  const avgRisk = (diabetesRisk + heartRisk + strokeRisk) / 3;
  const overallScore = maxRisk * 0.6 + avgRisk * 0.4; // Weight toward highest risk

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    diabetesRisk: Math.round(diabetesRisk * 10) / 10,
    heartRisk: Math.round(heartRisk * 10) / 10,
    strokeRisk: Math.round(strokeRisk * 10) / 10,
  };
}

interface RiskFactor {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  maxPoints: number;
  type: 'negative' | 'warning' | 'positive';
  icon: string;
}

function calculateRiskFactors(answers: Record<string, string>): RiskFactor[] {
  const factors: RiskFactor[] = [];
  
  // === BIOMETRIC FACTORS ===
  const heightCm = parseNumeric(answers.height || answers.WHD010);
  const weightKg = parseNumeric(answers.weight_current || answers.WHD020 || answers.weight);
  const bmi = calculateBMI(heightCm, weightKg);
  
  if (bmi > 0) {
    let bmiPoints = 0;
    let bmiDescription = '';
    let bmiType: 'negative' | 'warning' | 'positive' = 'positive';
    
    if (bmi < 18.5) {
      bmiPoints = 5;
      bmiDescription = `Underweight (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'warning';
    } else if (bmi < 25) {
      bmiPoints = 0;
      bmiDescription = `Normal weight (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'positive';
    } else if (bmi < 30) {
      bmiPoints = 10;
      bmiDescription = `Overweight (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'warning';
    } else if (bmi < 35) {
      bmiPoints = 18;
      bmiDescription = `Obesity Class I (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'negative';
    } else if (bmi < 40) {
      bmiPoints = 25;
      bmiDescription = `Obesity Class II (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'negative';
    } else {
      bmiPoints = 30;
      bmiDescription = `Obesity Class III (BMI: ${bmi.toFixed(1)})`;
      bmiType = 'negative';
    }
    
    factors.push({
      id: 'bmi',
      name: 'Body Mass Index',
      description: bmiDescription,
      category: 'Biometrics',
      points: bmiPoints,
      maxPoints: 30,
      type: bmiType,
      icon: 'scale',
    });
  }
  
  // Weight change
  const weightOneYearAgo = parseNumeric(answers.weight_year_ago || answers.WHD050);
  if (weightOneYearAgo > 0 && weightKg > 0) {
    const weightGainKg = weightKg - weightOneYearAgo;
    if (weightGainKg >= 10) {
      factors.push({
        id: 'weight-gain',
        name: 'Significant Weight Gain',
        description: `Gained ${weightGainKg.toFixed(1)} kg in the past year`,
        category: 'Biometrics',
        points: 8,
        maxPoints: 8,
        type: 'negative',
        icon: 'trending-up',
      });
    } else if (weightGainKg >= 5) {
      factors.push({
        id: 'weight-gain',
        name: 'Moderate Weight Gain',
        description: `Gained ${weightGainKg.toFixed(1)} kg in the past year`,
        category: 'Biometrics',
        points: 4,
        maxPoints: 8,
        type: 'warning',
        icon: 'trending-up',
      });
    } else if (weightGainKg <= -5) {
      factors.push({
        id: 'weight-loss',
        name: 'Weight Loss',
        description: `Lost ${Math.abs(weightGainKg).toFixed(1)} kg in the past year`,
        category: 'Biometrics',
        points: 0,
        maxPoints: 8,
        type: 'positive',
        icon: 'trending-down',
      });
    }
  }
  
  // Age - NOT included in displayed factors since users cannot control their age
  // Age is still used internally for risk calculation but not shown to users
  
  // === MEDICAL HISTORY ===
  const hasDiabetes = answers.DIQ180 === '1' || answers.diabetes === 'yes';
  const hasPrediabetes = answers.DIQ160 === '1' || answers.prediabetes === 'yes';
  
  if (hasDiabetes) {
    factors.push({
      id: 'diabetes',
      name: 'Diabetes Diagnosis',
      description: 'Previously diagnosed with diabetes',
      category: 'Medical History',
      points: 40,
      maxPoints: 40,
      type: 'negative',
      icon: 'droplets',
    });
  } else if (hasPrediabetes) {
    factors.push({
      id: 'prediabetes',
      name: 'Prediabetes',
      description: 'Previously diagnosed with prediabetes',
      category: 'Medical History',
      points: 25,
      maxPoints: 40,
      type: 'negative',
      icon: 'droplets',
    });
  }
  
  const hasHighBP = answers.BPQ020 === '1' || answers.high_blood_pressure === 'yes';
  if (hasHighBP) {
    factors.push({
      id: 'high-bp',
      name: 'High Blood Pressure',
      description: 'Diagnosed with hypertension',
      category: 'Medical History',
      points: 25,
      maxPoints: 25,
      type: 'negative',
      icon: 'heart-pulse',
    });
  }
  
  const hasHighCholesterol = answers.BPQ080 === '1' || answers.high_cholesterol === 'yes';
  if (hasHighCholesterol) {
    factors.push({
      id: 'high-cholesterol',
      name: 'High Cholesterol',
      description: 'Diagnosed with high cholesterol',
      category: 'Medical History',
      points: 18,
      maxPoints: 18,
      type: 'negative',
      icon: 'activity',
    });
  }
  
  const hadHeartAttack = answers.MCQ160A === '1';
  if (hadHeartAttack) {
    factors.push({
      id: 'heart-attack',
      name: 'Previous Heart Attack',
      description: 'History of myocardial infarction',
      category: 'Medical History',
      points: 25,
      maxPoints: 25,
      type: 'negative',
      icon: 'heart-crack',
    });
  }
  
  const hasHeartFailure = answers.MCQ160B === '1';
  if (hasHeartFailure) {
    factors.push({
      id: 'heart-failure',
      name: 'Heart Failure',
      description: 'Diagnosed with heart failure',
      category: 'Medical History',
      points: 30,
      maxPoints: 30,
      type: 'negative',
      icon: 'heart-off',
    });
  }
  
  const hasCoronaryDisease = answers.MCQ160C === '1';
  if (hasCoronaryDisease) {
    factors.push({
      id: 'coronary-disease',
      name: 'Coronary Heart Disease',
      description: 'Diagnosed with coronary artery disease',
      category: 'Medical History',
      points: 20,
      maxPoints: 20,
      type: 'negative',
      icon: 'heart',
    });
  }
  
  const hadStroke = answers.MCQ160E === '1';
  if (hadStroke) {
    factors.push({
      id: 'stroke',
      name: 'Previous Stroke',
      description: 'History of stroke',
      category: 'Medical History',
      points: 30,
      maxPoints: 30,
      type: 'negative',
      icon: 'brain',
    });
  }
  
  const hasKidneyDisease = answers.KIQ022 === '1';
  if (hasKidneyDisease) {
    factors.push({
      id: 'kidney-disease',
      name: 'Kidney Disease',
      description: 'Diagnosed with kidney disease',
      category: 'Medical History',
      points: 15,
      maxPoints: 15,
      type: 'negative',
      icon: 'kidney',
    });
  }
  
  // === LIFESTYLE FACTORS ===
  const moderateActivity = parseNumeric(answers.PAD790);
  const sedentaryHours = parseNumeric(answers.PAD680);
  
  if (moderateActivity >= 5) {
    factors.push({
      id: 'activity',
      name: 'Very Active Lifestyle',
      description: `${moderateActivity}+ hours of moderate activity per week`,
      category: 'Lifestyle',
      points: 0,
      maxPoints: 27,
      type: 'positive',
      icon: 'dumbbell',
    });
  } else if (moderateActivity >= 2.5) {
    factors.push({
      id: 'activity',
      name: 'Active Lifestyle',
      description: `${moderateActivity} hours of moderate activity per week`,
      category: 'Lifestyle',
      points: 0,
      maxPoints: 27,
      type: 'positive',
      icon: 'dumbbell',
    });
  } else if (moderateActivity >= 1) {
    factors.push({
      id: 'activity',
      name: 'Limited Physical Activity',
      description: `Only ${moderateActivity} hour(s) of activity per week`,
      category: 'Lifestyle',
      points: 5,
      maxPoints: 27,
      type: 'warning',
      icon: 'dumbbell',
    });
  } else if (moderateActivity === 0 || answers.PAD790) {
    factors.push({
      id: 'activity',
      name: 'Sedentary Lifestyle',
      description: 'Little to no regular physical activity',
      category: 'Lifestyle',
      points: 15,
      maxPoints: 27,
      type: 'negative',
      icon: 'dumbbell',
    });
  }
  
  if (sedentaryHours >= 10) {
    factors.push({
      id: 'sedentary',
      name: 'Highly Sedentary',
      description: `${sedentaryHours}+ hours of sitting per day`,
      category: 'Lifestyle',
      points: 12,
      maxPoints: 12,
      type: 'negative',
      icon: 'armchair',
    });
  } else if (sedentaryHours >= 8) {
    factors.push({
      id: 'sedentary',
      name: 'Extended Sitting Time',
      description: `${sedentaryHours} hours of sitting per day`,
      category: 'Lifestyle',
      points: 8,
      maxPoints: 12,
      type: 'warning',
      icon: 'armchair',
    });
  }
  
  // Sleep
  const weekdaySleep = parseNumeric(answers.SLD012, 7);
  const weekendSleep = parseNumeric(answers.SLD013, 7);
  const avgSleep = (weekdaySleep + weekendSleep) / 2;
  const hasSleepTrouble = answers.DPQ030 === '1' || answers.DPQ030 === '2';
  
  if (avgSleep > 0 && (answers.SLD012 || answers.SLD013)) {
    let sleepPoints = 0;
    let sleepType: 'negative' | 'warning' | 'positive' = 'positive';
    let sleepDescription = '';
    
    if (avgSleep < 5) {
      sleepPoints = 15;
      sleepType = 'negative';
      sleepDescription = `Severe sleep deprivation (${avgSleep.toFixed(1)} hrs/night)`;
    } else if (avgSleep < 6) {
      sleepPoints = 10;
      sleepType = 'negative';
      sleepDescription = `Sleep deprived (${avgSleep.toFixed(1)} hrs/night)`;
    } else if (avgSleep < 7) {
      sleepPoints = 5;
      sleepType = 'warning';
      sleepDescription = `Slightly low sleep (${avgSleep.toFixed(1)} hrs/night)`;
    } else if (avgSleep <= 9) {
      sleepPoints = 0;
      sleepType = 'positive';
      sleepDescription = `Optimal sleep (${avgSleep.toFixed(1)} hrs/night)`;
    } else {
      sleepPoints = 5;
      sleepType = 'warning';
      sleepDescription = `Excessive sleep (${avgSleep.toFixed(1)} hrs/night)`;
    }
    
    factors.push({
      id: 'sleep',
      name: 'Sleep Quality',
      description: sleepDescription,
      category: 'Lifestyle',
      points: sleepPoints,
      maxPoints: 23,
      type: sleepType,
      icon: 'moon',
    });
  }
  
  if (hasSleepTrouble) {
    factors.push({
      id: 'sleep-trouble',
      name: 'Sleep Difficulties',
      description: 'Reports trouble sleeping',
      category: 'Lifestyle',
      points: 8,
      maxPoints: 8,
      type: 'warning',
      icon: 'moon',
    });
  }
  
  // Alcohol
  const alcoholFreq = parseNumeric(answers.ALQ121);
  if (alcoholFreq >= 10) {
    factors.push({
      id: 'alcohol',
      name: 'High Alcohol Consumption',
      description: `${alcoholFreq}+ drinks per week`,
      category: 'Lifestyle',
      points: 15,
      maxPoints: 15,
      type: 'negative',
      icon: 'wine',
    });
  } else if (alcoholFreq >= 5) {
    factors.push({
      id: 'alcohol',
      name: 'Moderate Alcohol Consumption',
      description: `${alcoholFreq} drinks per week`,
      category: 'Lifestyle',
      points: 8,
      maxPoints: 15,
      type: 'warning',
      icon: 'wine',
    });
  } else if (alcoholFreq > 0 && alcoholFreq < 5) {
    factors.push({
      id: 'alcohol',
      name: 'Low Alcohol Consumption',
      description: `${alcoholFreq} drinks per week`,
      category: 'Lifestyle',
      points: 0,
      maxPoints: 15,
      type: 'positive',
      icon: 'wine',
    });
  }
  
  // Balance/Falls
  const hasBalanceIssues = answers.BAQ321C === '1';
  const hasFalls = answers.BAQ530 === '1' || answers.BAQ530 === '2';
  if (hasBalanceIssues || hasFalls) {
    factors.push({
      id: 'balance',
      name: 'Balance/Fall Risk',
      description: 'History of balance issues or falls',
      category: 'Physical Health',
      points: 8,
      maxPoints: 8,
      type: 'warning',
      icon: 'footprints',
    });
  }
  
  // Oral Health
  const poorDentalHealth = answers.OHQ845 === '4' || answers.OHQ845 === '5';
  const hasGumDisease = answers.OHQ620 === '1';
  const hasLooseTeeth = answers.OHQ630 === '1';
  const hasBoneLoss = answers.OHQ660 === '1';
  
  const oralHealthIssues = [poorDentalHealth, hasGumDisease, hasLooseTeeth, hasBoneLoss].filter(Boolean).length;
  if (oralHealthIssues >= 3) {
    factors.push({
      id: 'oral-health',
      name: 'Poor Oral Health',
      description: 'Multiple oral health concerns',
      category: 'Physical Health',
      points: 10,
      maxPoints: 10,
      type: 'negative',
      icon: 'smile',
    });
  } else if (oralHealthIssues >= 1) {
    factors.push({
      id: 'oral-health',
      name: 'Oral Health Concerns',
      description: 'Some oral health issues present',
      category: 'Physical Health',
      points: 5,
      maxPoints: 10,
      type: 'warning',
      icon: 'smile',
    });
  }
  
  // General Health
  const generalHealth = answers.HUQ010;
  if (generalHealth === '4' || generalHealth === '5') {
    factors.push({
      id: 'general-health',
      name: 'Self-Assessed Health',
      description: generalHealth === '4' ? 'Fair health' : 'Poor health',
      category: 'General',
      points: 8,
      maxPoints: 8,
      type: 'negative',
      icon: 'user',
    });
  } else if (generalHealth === '1') {
    factors.push({
      id: 'general-health',
      name: 'Self-Assessed Health',
      description: 'Excellent health',
      category: 'General',
      points: 0,
      maxPoints: 8,
      type: 'positive',
      icon: 'user',
    });
  } else if (generalHealth === '2' || generalHealth === '3') {
    factors.push({
      id: 'general-health',
      name: 'Self-Assessed Health',
      description: generalHealth === '2' ? 'Very good health' : 'Good health',
      category: 'General',
      points: 0,
      maxPoints: 8,
      type: 'positive',
      icon: 'user',
    });
  }
  
  // Medications
  const takingAspirin = answers.RXQ510 === '1';
  if (takingAspirin) {
    factors.push({
      id: 'aspirin',
      name: 'Preventive Aspirin Use',
      description: 'Taking aspirin for heart health',
      category: 'Medical',
      points: 5,
      maxPoints: 5,
      type: 'warning',
      icon: 'pill',
    });
  }
  
  const takingPrescriptions = answers.RXQ033 === '1';
  if (takingPrescriptions && !hasDiabetes && !hasHighBP && !hasHighCholesterol) {
    factors.push({
      id: 'prescriptions',
      name: 'Prescription Medications',
      description: 'Taking regular prescription medications',
      category: 'Medical',
      points: 0,
      maxPoints: 5,
      type: 'positive',
      icon: 'pill',
    });
  }
  
  // Filter out zero-point factors (they don't contribute to risk)
  // Keep positive factors only if they genuinely have 0 points (indicating good health choices)
  const contributingFactors = factors.filter(f => {
    if (f.type === 'positive') return true; // Always show positive factors as they represent healthy choices
    return f.points > 0; // Only show negative/warning factors if they contribute points
  });
  
  // Sort by points (highest first)
  contributingFactors.sort((a, b) => b.points - a.points);
  
  return contributingFactors;
}
