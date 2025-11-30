import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertQuestionnaireSchema, 
  insertUserProfileSchema,
  insertUserPreferencesSchema,
  insertUserGamificationSchema,
  insertRiskScoreSchema 
} from "@shared/schema";

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

  // Risk score calculation endpoint
  app.post("/api/risk-scores/:userId/calculate", async (req, res) => {
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
      
      res.json(saved);
    } catch (error) {
      console.error("Error calculating risk score:", error);
      res.status(500).json({ error: "Failed to calculate risk score" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Risk score calculation logic
function calculateRiskScores(answers: Record<string, string>): {
  overallScore: number;
  diabetesRisk: number;
  heartRisk: number;
  strokeRisk: number;
} {
  let diabetesRisk = 0;
  let heartRisk = 0;
  let strokeRisk = 0;

  // Diabetes risk factors
  if (answers.prediabetes === 'yes') diabetesRisk += 30;
  if (answers.diabetes === 'yes') diabetesRisk += 50;
  if (answers.high_blood_pressure === 'yes') diabetesRisk += 10;
  if (answers.diet_sugar === 'often' || answers.diet_sugar === 'always') diabetesRisk += 15;
  if (answers.diet_processed_foods === 'often' || answers.diet_processed_foods === 'always') diabetesRisk += 10;
  
  // Heart risk factors
  if (answers.high_blood_pressure === 'yes') heartRisk += 25;
  if (answers.high_cholesterol === 'yes') heartRisk += 25;
  if (answers.diabetes === 'yes') heartRisk += 15;
  if (answers.stress_level === 'high' || answers.stress_level === 'very_high') heartRisk += 15;
  if (answers.moderate_activity === '0' && answers.vigorous_activity === '0') heartRisk += 10;
  
  // Stroke risk factors
  if (answers.high_blood_pressure === 'yes') strokeRisk += 30;
  if (answers.diabetes === 'yes') strokeRisk += 15;
  if (answers.high_cholesterol === 'yes') strokeRisk += 15;
  if (answers.alcohol_frequency === 'daily' || answers.alcohol_frequency === 'frequently') strokeRisk += 10;
  
  // Normalize scores to 0-100
  diabetesRisk = Math.min(100, diabetesRisk);
  heartRisk = Math.min(100, heartRisk);
  strokeRisk = Math.min(100, strokeRisk);
  
  // Calculate overall score (weighted average)
  const overallScore = (diabetesRisk * 0.35 + heartRisk * 0.35 + strokeRisk * 0.30);

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    diabetesRisk: Math.round(diabetesRisk * 10) / 10,
    heartRisk: Math.round(heartRisk * 10) / 10,
    strokeRisk: Math.round(strokeRisk * 10) / 10,
  };
}
