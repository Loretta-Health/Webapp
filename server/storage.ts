import {
  type User,
  type InsertUser,
  type QuestionnaireAnswers,
  type InsertQuestionnaireAnswers,
  type UserProfile,
  type InsertUserProfile,
  type UserPreferences,
  type InsertUserPreferences,
  type UserGamification,
  type InsertUserGamification,
  type RiskScore,
  type InsertRiskScore,
  users,
  questionnaireAnswers,
  userProfiles,
  userPreferences,
  userGamification,
  riskScores,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Questionnaire methods
  getQuestionnaireAnswers(userId: string, category: string): Promise<QuestionnaireAnswers | undefined>;
  getAllQuestionnaireAnswers(userId: string): Promise<QuestionnaireAnswers[]>;
  saveQuestionnaireAnswers(data: InsertQuestionnaireAnswers): Promise<QuestionnaireAnswers>;

  // Profile methods
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  saveUserProfile(data: InsertUserProfile): Promise<UserProfile>;

  // Preferences methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  saveUserPreferences(data: InsertUserPreferences): Promise<UserPreferences>;

  // Gamification methods
  getUserGamification(userId: string): Promise<UserGamification | undefined>;
  saveUserGamification(data: InsertUserGamification): Promise<UserGamification>;
  addXP(userId: string, amount: number): Promise<UserGamification>;
  updateStreak(userId: string): Promise<UserGamification>;

  // Risk score methods
  getLatestRiskScore(userId: string): Promise<RiskScore | undefined>;
  getAllRiskScores(userId: string): Promise<RiskScore[]>;
  saveRiskScore(data: InsertRiskScore): Promise<RiskScore>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Questionnaire methods
  async getQuestionnaireAnswers(userId: string, category: string): Promise<QuestionnaireAnswers | undefined> {
    const [answers] = await db
      .select()
      .from(questionnaireAnswers)
      .where(
        and(
          eq(questionnaireAnswers.userId, userId),
          eq(questionnaireAnswers.category, category)
        )
      );
    return answers;
  }

  async getAllQuestionnaireAnswers(userId: string): Promise<QuestionnaireAnswers[]> {
    return await db
      .select()
      .from(questionnaireAnswers)
      .where(eq(questionnaireAnswers.userId, userId));
  }

  async saveQuestionnaireAnswers(data: InsertQuestionnaireAnswers): Promise<QuestionnaireAnswers> {
    const existing = await this.getQuestionnaireAnswers(data.userId, data.category);

    if (existing) {
      const [updated] = await db
        .update(questionnaireAnswers)
        .set({ answers: data.answers, updatedAt: new Date() })
        .where(eq(questionnaireAnswers.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(questionnaireAnswers)
        .values(data)
        .returning();
      return created;
    }
  }

  // Profile methods
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async saveUserProfile(data: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(data.userId);

    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userProfiles.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProfiles)
        .values(data)
        .returning();
      return created;
    }
  }

  // Preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async saveUserPreferences(data: InsertUserPreferences): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(data.userId);

    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userPreferences)
        .values(data)
        .returning();
      return created;
    }
  }

  // Gamification methods
  async getUserGamification(userId: string): Promise<UserGamification | undefined> {
    const [gamification] = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, userId));
    return gamification;
  }

  async saveUserGamification(data: InsertUserGamification): Promise<UserGamification> {
    const existing = await this.getUserGamification(data.userId);

    const updateData = {
      userId: data.userId,
      xp: data.xp,
      level: data.level,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastCheckIn: data.lastCheckIn,
      lives: data.lives,
      achievements: data.achievements as string[] | undefined,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await db
        .update(userGamification)
        .set(updateData)
        .where(eq(userGamification.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userGamification)
        .values(updateData)
        .returning();
      return created;
    }
  }

  async addXP(userId: string, amount: number): Promise<UserGamification> {
    let gamification = await this.getUserGamification(userId);
    
    if (!gamification) {
      gamification = await this.saveUserGamification({ userId, xp: 0, level: 1 });
    }

    const newXP = (gamification.xp || 0) + amount;
    const newLevel = Math.floor(newXP / 100) + 1;

    const [updated] = await db
      .update(userGamification)
      .set({ xp: newXP, level: newLevel, updatedAt: new Date() })
      .where(eq(userGamification.id, gamification.id))
      .returning();
    return updated;
  }

  async updateStreak(userId: string): Promise<UserGamification> {
    let gamification = await this.getUserGamification(userId);
    
    if (!gamification) {
      gamification = await this.saveUserGamification({ userId, currentStreak: 0, longestStreak: 0 });
    }

    const now = new Date();
    const lastCheckIn = gamification.lastCheckIn;
    let newStreak = gamification.currentStreak || 0;

    if (lastCheckIn) {
      const hoursSinceLastCheckIn = (now.getTime() - new Date(lastCheckIn).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCheckIn < 24) {
        // Already checked in today, no change
      } else if (hoursSinceLastCheckIn < 48) {
        // Checked in yesterday, increment streak
        newStreak += 1;
      } else {
        // Missed a day, reset streak
        newStreak = 1;
      }
    } else {
      // First check-in
      newStreak = 1;
    }

    const newLongestStreak = Math.max(gamification.longestStreak || 0, newStreak);

    const [updated] = await db
      .update(userGamification)
      .set({ 
        currentStreak: newStreak, 
        longestStreak: newLongestStreak,
        lastCheckIn: now,
        updatedAt: now 
      })
      .where(eq(userGamification.id, gamification.id))
      .returning();
    return updated;
  }

  // Risk score methods
  async getLatestRiskScore(userId: string): Promise<RiskScore | undefined> {
    const [score] = await db
      .select()
      .from(riskScores)
      .where(eq(riskScores.userId, userId))
      .orderBy(desc(riskScores.calculatedAt))
      .limit(1);
    return score;
  }

  async getAllRiskScores(userId: string): Promise<RiskScore[]> {
    return await db
      .select()
      .from(riskScores)
      .where(eq(riskScores.userId, userId))
      .orderBy(desc(riskScores.calculatedAt));
  }

  async saveRiskScore(data: InsertRiskScore): Promise<RiskScore> {
    const [created] = await db
      .insert(riskScores)
      .values(data)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
