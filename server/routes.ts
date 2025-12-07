import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
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

// Scaleway AI configuration
const SCALEWAY_BASE_URL = 'https://api.scaleway.ai/v1';
const SCALEWAY_MODEL = 'gemma-3-27b-it';
const SCALEWAY_API_KEY = process.env.SCALEWAY_API_KEY;

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

async function chatWithScaleway(messages: ChatMessage[]): Promise<string> {
  if (!SCALEWAY_API_KEY) {
    throw new Error('Missing SCALEWAY_API_KEY');
  }

  const response = await fetch(`${SCALEWAY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SCALEWAY_API_KEY}`,
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

const HEALTH_NAVIGATOR_SYSTEM_PROMPT = `You are the Health Literacy Navigator, an AI health assistant for Loretta - a gamified health and wellness app designed to help users understand their health data, build healthy habits, and achieve their wellness goals.

CORE RESPONSIBILITIES:
1. Help users understand medical terms, lab results, and health documents in simple, everyday language
2. Explain medication side effects and interactions clearly
3. Analyze health metrics (steps, sleep, heart rate, calories) and provide actionable insights
4. Provide personalized health education and wellness tips based on user data
5. Encourage healthy habits and lifestyle choices through the app's mission system
6. Support users in their health journey with empathy and encouragement

COMMUNICATION STYLE:
- Use simple, clear language that anyone can understand
- When explaining medical terms, provide both the simple explanation and the technical term
- Be encouraging and supportive, never judgmental
- Keep responses concise but informative
- Use bullet points and formatting to make information easy to read
- Be warm, friendly, and approachable like a helpful friend who happens to know a lot about health

HEALTH METRIC ANALYSIS:
When users share health metrics, analyze them thoughtfully:
- Steps: Recommend 7,000-10,000 daily steps for general health
- Sleep: Adults need 7-9 hours; note quality matters too
- Heart Rate: Resting HR of 60-100 bpm is normal; lower often indicates fitness
- Calories: Consider activity level and goals when discussing calorie burn

MISSION SYSTEM:
Loretta uses a gamified mission system to encourage healthy behaviors. When appropriate:
- Suggest relevant missions that could help the user achieve their health goals
- Reference XP, streaks, and achievements to motivate continued engagement
- Celebrate progress and milestones enthusiastically

IMPORTANT GUIDELINES:
- Never provide specific medical diagnoses or treatment recommendations
- Always remind users to consult healthcare providers for medical concerns
- Focus on general wellness, prevention, and healthy lifestyle choices
- If asked about symptoms or conditions, provide educational information and encourage professional consultation
- Respect user privacy and handle health information sensitively`;

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
  
  // Chat endpoint for Health Navigator
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const chatMessages: ChatMessage[] = [
        { role: "system", content: HEALTH_NAVIGATOR_SYSTEM_PROMPT },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ];

      const assistantMessage = await chatWithScaleway(chatMessages);
      
      res.json({ message: assistantMessage || "I'm sorry, I couldn't generate a response. Please try again." });
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

  app.get("/api/questionnaires/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("[API] GET /api/questionnaires/:userId - Fetching questionnaires for:", userId);
      const answers = await storage.getAllQuestionnaireAnswers(userId);
      console.log("[API] Found", answers.length, "questionnaire records for user:", userId);
      res.json(answers);
    } catch (error) {
      console.error("[API] Error fetching questionnaires:", error);
      res.status(500).json({ error: "Failed to fetch questionnaire answers" });
    }
  });

  app.get("/api/questionnaires/:userId/:category", async (req, res) => {
    try {
      const { userId, category } = req.params;
      console.log("[API] GET /api/questionnaires/:userId/:category - Fetching for:", { userId, category });
      const answers = await storage.getQuestionnaireAnswers(userId, category);
      res.json(answers || null);
    } catch (error) {
      console.error("[API] Error fetching questionnaire:", error);
      res.status(500).json({ error: "Failed to fetch questionnaire answers" });
    }
  });

  app.post("/api/questionnaires", async (req, res) => {
    try {
      console.log("[API] POST /api/questionnaires - Received body:", JSON.stringify(req.body));
      const validatedData = insertQuestionnaireSchema.parse(req.body);
      console.log("[API] Validated questionnaire data:", JSON.stringify(validatedData));
      const saved = await storage.saveQuestionnaireAnswers(validatedData);
      console.log("[API] Questionnaire saved successfully:", saved.id);
      res.json(saved);
    } catch (error) {
      console.error("[API] Error saving questionnaire:", error);
      res.status(400).json({ error: "Invalid questionnaire data" });
    }
  });

  // ========================
  // User Profile Endpoints
  // ========================

  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("[API] GET /api/profile/:userId - Fetching profile for:", userId);
      const profile = await storage.getUserProfile(userId);
      console.log("[API] Profile found:", profile ? "yes" : "no");
      res.json(profile || null);
    } catch (error) {
      console.error("[API] Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      console.log("[API] POST /api/profile - Received body:", JSON.stringify(req.body));
      const validatedData = insertUserProfileSchema.parse(req.body);
      console.log("[API] Validated profile data for user:", validatedData.userId);
      const saved = await storage.saveUserProfile(validatedData);
      console.log("[API] Profile saved successfully:", saved.id);
      res.json(saved);
    } catch (error) {
      console.error("[API] Error saving profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // ========================
  // User Preferences Endpoints
  // ========================

  app.get("/api/preferences/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("[API] GET /api/preferences/:userId - Fetching preferences for:", userId);
      const prefs = await storage.getUserPreferences(userId);
      console.log("[API] Preferences found:", prefs ? "yes" : "no");
      res.json(prefs || null);
    } catch (error) {
      console.error("[API] Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      console.log("[API] POST /api/preferences - Received body:", JSON.stringify(req.body));
      const validatedData = insertUserPreferencesSchema.parse(req.body);
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

  app.get("/api/gamification/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let gamification = await storage.getUserGamification(userId);
      
      if (!gamification) {
        gamification = await storage.saveUserGamification({
          userId,
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          lives: 5,
          achievements: [],
        });
      }
      
      res.json(gamification);
    } catch (error) {
      console.error("Error fetching gamification:", error);
      res.status(500).json({ error: "Failed to fetch gamification data" });
    }
  });

  app.post("/api/gamification", async (req, res) => {
    try {
      const validatedData = insertUserGamificationSchema.parse(req.body);
      const saved = await storage.saveUserGamification(validatedData);
      res.json(saved);
    } catch (error) {
      console.error("Error saving gamification:", error);
      res.status(400).json({ error: "Invalid gamification data" });
    }
  });

  app.post("/api/gamification/:userId/xp", async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body;
      
      if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ error: "Invalid XP amount" });
      }
      
      const updated = await storage.addXP(userId, amount);
      res.json(updated);
    } catch (error) {
      console.error("Error adding XP:", error);
      res.status(500).json({ error: "Failed to add XP" });
    }
  });

  app.post("/api/gamification/:userId/checkin", async (req, res) => {
    try {
      const { userId } = req.params;
      const updated = await storage.updateStreak(userId);
      
      // Also add XP for checking in
      await storage.addXP(userId, 10);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ error: "Failed to update streak" });
    }
  });

  // ========================
  // Risk Score Endpoints
  // ========================

  app.get("/api/risk-scores/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const scores = await storage.getAllRiskScores(userId);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching risk scores:", error);
      res.status(500).json({ error: "Failed to fetch risk scores" });
    }
  });

  app.get("/api/risk-scores/:userId/latest", async (req, res) => {
    try {
      const { userId } = req.params;
      const score = await storage.getLatestRiskScore(userId);
      res.json(score || null);
    } catch (error) {
      console.error("Error fetching latest risk score:", error);
      res.status(500).json({ error: "Failed to fetch latest risk score" });
    }
  });

  app.post("/api/risk-scores", async (req, res) => {
    try {
      const validatedData = insertRiskScoreSchema.parse(req.body);
      const saved = await storage.saveRiskScore(validatedData);
      res.json(saved);
    } catch (error) {
      console.error("Error saving risk score:", error);
      res.status(400).json({ error: "Invalid risk score data" });
    }
  });

  // @deprecated - Legacy risk score calculation endpoint
  // Kept as fallback when ML prediction API is unavailable
  // TODO: Remove once ML prediction service is stable in production
  app.post("/api/risk-scores/:userId/calculate", async (req, res) => {
    console.warn("[DEPRECATED] /api/risk-scores/:userId/calculate endpoint called - using legacy risk calculation as fallback");
    try {
      const { userId } = req.params;
      
      // Get all questionnaire answers for this user
      const answers = await storage.getAllQuestionnaireAnswers(userId);
      
      // Combine all answers into one object
      const allAnswers: Record<string, string> = {};
      answers.forEach(a => {
        Object.assign(allAnswers, a.answers);
      });
      
      // Calculate risk scores based on answers
      const riskScore = calculateRiskScores(allAnswers);
      
      // Save the calculated risk score
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

  // ========================
  // Emotional Check-in Endpoints
  // ========================

  app.get("/api/emotional-checkins/:userId/latest", async (req, res) => {
    try {
      const { userId } = req.params;
      const checkin = await storage.getLatestEmotionalCheckin(userId);
      res.json(checkin || null);
    } catch (error) {
      console.error("Error fetching latest emotional check-in:", error);
      res.status(500).json({ error: "Failed to fetch latest emotional check-in" });
    }
  });

  app.get("/api/emotional-checkins/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const checkins = await storage.getAllEmotionalCheckins(userId);
      res.json(checkins);
    } catch (error) {
      console.error("Error fetching all emotional check-ins:", error);
      res.status(500).json({ error: "Failed to fetch emotional check-ins" });
    }
  });

  app.post("/api/emotional-checkins", async (req, res) => {
    try {
      const { userId, emotion, userMessage, aiResponse, xpAwarded = 10 } = req.body;
      
      if (!userId || !emotion) {
        return res.status(400).json({ error: "userId and emotion are required" });
      }

      const saved = await storage.saveEmotionalCheckin({
        userId,
        emotion,
        userMessage,
        aiResponse,
        xpAwarded,
      });

      // Award XP for emotional check-in
      await storage.addXP(userId, xpAwarded);

      res.json(saved);
    } catch (error) {
      console.error("Error saving emotional check-in:", error);
      res.status(500).json({ error: "Failed to save emotional check-in" });
    }
  });

  // ========================
  // User Mission Endpoints
  // ========================

  app.get("/api/missions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const missions = await storage.ensureDefaultMissionsForUser(userId);
      res.json(missions);
    } catch (error) {
      console.error("Error fetching missions:", error);
      res.status(500).json({ error: "Failed to fetch missions" });
    }
  });

  app.post("/api/missions", async (req, res) => {
    try {
      const validatedData = insertUserMissionSchema.parse(req.body);
      const created = await storage.createUserMission(validatedData);
      res.json(created);
    } catch (error) {
      console.error("Error creating mission:", error);
      res.status(400).json({ error: "Invalid mission data" });
    }
  });

  app.patch("/api/missions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateUserMissionSchema.parse(req.body);
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

  app.delete("/api/missions/:id", async (req, res) => {
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
  // Achievement Endpoints
  // ========================

  app.get("/api/achievements/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const achievements = await storage.ensureDefaultAchievementsForUser(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.patch("/api/achievements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { progress, unlocked } = req.body;
      
      const updateData: { progress?: number; unlocked?: boolean; unlockedAt?: Date } = {};
      if (typeof progress === 'number') {
        updateData.progress = progress;
      }
      if (typeof unlocked === 'boolean') {
        updateData.unlocked = unlocked;
        if (unlocked) {
          updateData.unlockedAt = new Date();
        }
      }
      
      const updated = await storage.updateUserAchievement(id, updateData);
      
      if (!updated) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating achievement:", error);
      res.status(400).json({ error: "Invalid achievement data" });
    }
  });

  app.post("/api/achievements/:userId/unlock/:key", async (req, res) => {
    try {
      const { userId, key } = req.params;
      const unlocked = await storage.unlockAchievement(userId, key);
      
      if (!unlocked) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      
      res.json(unlocked);
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      res.status(500).json({ error: "Failed to unlock achievement" });
    }
  });

  // ========================
  // Activity Endpoints
  // ========================

  app.get("/api/activities/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days as string) || 7;
      const activities = await storage.getUserActivities(userId, days);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/:userId/today", async (req, res) => {
    try {
      const { userId } = req.params;
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
    try {
      const { userId, date, ...data } = req.body;
      const activityDate = date || new Date().toISOString().split('T')[0];
      const saved = await storage.saveUserActivity({ userId, date: activityDate, ...data });
      res.json(saved);
    } catch (error) {
      console.error("Error saving activity:", error);
      res.status(400).json({ error: "Failed to save activity" });
    }
  });

  app.patch("/api/activities/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { date, ...data } = req.body;
      const activityDate = date || new Date().toISOString().split('T')[0];
      const updated = await storage.updateUserActivity(userId, activityDate, data);
      res.json(updated);
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

  app.get("/api/teams/user/:userId", async (req, res) => {
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
          return {
            ...member,
            username: user?.username || "Unknown",
            xp: gamification?.xp || 0,
            level: gamification?.level || 1,
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
