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
  type EmotionalCheckin,
  type InsertEmotionalCheckin,
  type UserMission,
  type InsertUserMission,
  type UpdateUserMission,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type TeamInvite,
  type InsertTeamInvite,
  type UserAchievement,
  type InsertUserAchievement,
  type UpdateUserAchievement,
  users,
  questionnaireAnswers,
  userProfiles,
  userPreferences,
  userGamification,
  riskScores,
  emotionalCheckins,
  userMissions,
  teams,
  teamMembers,
  teamInvites,
  userAchievements,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
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

  // Emotional check-in methods
  getLatestEmotionalCheckin(userId: string): Promise<EmotionalCheckin | undefined>;
  saveEmotionalCheckin(data: InsertEmotionalCheckin): Promise<EmotionalCheckin>;

  // User mission methods
  getUserMissions(userId: string): Promise<UserMission[]>;
  createUserMission(data: InsertUserMission): Promise<UserMission>;
  updateUserMission(id: string, data: UpdateUserMission): Promise<UserMission | undefined>;
  deleteUserMission(id: string): Promise<void>;
  ensureDefaultMissionsForUser(userId: string): Promise<UserMission[]>;
  resetUserMissions(userId: string): Promise<UserMission[]>;

  // Team methods
  createTeam(data: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  getUserTeams(userId: string): Promise<Team[]>;
  updateTeam(id: string, data: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<void>;

  // Team member methods
  addTeamMember(data: InsertTeamMember): Promise<TeamMember>;
  getTeamMembers(teamId: string): Promise<TeamMember[]>;
  getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined>;
  updateTeamMemberConsent(teamId: string, userId: string, consent: boolean): Promise<TeamMember | undefined>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;

  // Team invite methods
  createTeamInvite(data: InsertTeamInvite): Promise<TeamInvite>;
  getTeamInviteByCode(code: string): Promise<TeamInvite | undefined>;
  getTeamInvites(teamId: string): Promise<TeamInvite[]>;
  useTeamInvite(code: string, userId: string): Promise<TeamInvite | undefined>;
  deleteTeamInvite(id: string): Promise<void>;

  // User achievement methods
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  ensureDefaultAchievementsForUser(userId: string): Promise<UserAchievement[]>;
  updateUserAchievement(id: string, data: UpdateUserAchievement): Promise<UserAchievement | undefined>;
  unlockAchievement(userId: string, achievementKey: string): Promise<UserAchievement | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
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

  // Emotional check-in methods
  async getLatestEmotionalCheckin(userId: string): Promise<EmotionalCheckin | undefined> {
    const [checkin] = await db
      .select()
      .from(emotionalCheckins)
      .where(eq(emotionalCheckins.userId, userId))
      .orderBy(desc(emotionalCheckins.checkedInAt))
      .limit(1);
    return checkin;
  }

  async getAllEmotionalCheckins(userId: string): Promise<EmotionalCheckin[]> {
    return await db
      .select()
      .from(emotionalCheckins)
      .where(eq(emotionalCheckins.userId, userId))
      .orderBy(desc(emotionalCheckins.checkedInAt));
  }

  async saveEmotionalCheckin(data: InsertEmotionalCheckin): Promise<EmotionalCheckin> {
    const [created] = await db
      .insert(emotionalCheckins)
      .values(data)
      .returning();
    return created;
  }

  // User mission methods
  async getUserMissions(userId: string): Promise<UserMission[]> {
    return await db
      .select()
      .from(userMissions)
      .where(eq(userMissions.userId, userId));
  }

  async createUserMission(data: InsertUserMission): Promise<UserMission> {
    const [created] = await db
      .insert(userMissions)
      .values(data)
      .returning();
    return created;
  }

  async updateUserMission(id: string, data: UpdateUserMission): Promise<UserMission | undefined> {
    const [updated] = await db
      .update(userMissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userMissions.id, id))
      .returning();
    return updated;
  }

  async deleteUserMission(id: string): Promise<void> {
    await db.delete(userMissions).where(eq(userMissions.id, id));
  }

  async ensureDefaultMissionsForUser(userId: string): Promise<UserMission[]> {
    const existingMissions = await this.getUserMissions(userId);
    
    if (existingMissions.length > 0) {
      return existingMissions;
    }

    const defaultMissions: InsertUserMission[] = [
      {
        userId,
        missionKey: 'jumping-jacks',
        title: 'Complete 10 jumping jacks',
        category: 'daily',
        xpReward: 50,
        progress: 0,
        maxProgress: 10,
        completed: false,
        href: '/mission-details?id=2',
        source: 'default',
      },
      {
        userId,
        missionKey: 'water-glasses',
        title: 'Drink 8 glasses of water',
        description: 'Stay hydrated throughout the day',
        category: 'daily',
        xpReward: 30,
        progress: 0,
        maxProgress: 8,
        completed: false,
        href: '/mission-details?id=1',
        source: 'default',
      },
      {
        userId,
        missionKey: 'streak-30',
        title: 'Maintain 30-day streak',
        description: 'Keep your streak alive!',
        category: 'bonus',
        xpReward: 500,
        progress: 0,
        maxProgress: 30,
        completed: false,
        legendary: true,
        href: '/streak',
        source: 'default',
      },
    ];

    const createdMissions: UserMission[] = [];
    for (const mission of defaultMissions) {
      const created = await this.createUserMission(mission);
      createdMissions.push(created);
    }

    return createdMissions;
  }

  async resetUserMissions(userId: string): Promise<UserMission[]> {
    await db.delete(userMissions).where(eq(userMissions.userId, userId));
    return await this.ensureDefaultMissionsForUser(userId);
  }

  // Team methods
  async createTeam(data: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(data).returning();
    return team;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const memberships = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    
    if (memberships.length === 0) return [];
    
    const teamIds = memberships.map(m => m.teamId);
    const userTeams: Team[] = [];
    
    for (const teamId of teamIds) {
      const team = await this.getTeam(teamId);
      if (team) userTeams.push(team);
    }
    
    return userTeams;
  }

  async updateTeam(id: string, data: Partial<InsertTeam>): Promise<Team | undefined> {
    const [updated] = await db
      .update(teams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    await db.delete(teamInvites).where(eq(teamInvites.teamId, id));
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Team member methods
  async addTeamMember(data: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(data).returning();
    return member;
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
  }

  async getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return member;
  }

  async updateTeamMemberConsent(teamId: string, userId: string, consent: boolean): Promise<TeamMember | undefined> {
    const [updated] = await db
      .update(teamMembers)
      .set({ 
        consentGiven: consent, 
        consentDate: consent ? new Date() : null 
      })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return updated;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  // Team invite methods
  async createTeamInvite(data: InsertTeamInvite): Promise<TeamInvite> {
    const [invite] = await db.insert(teamInvites).values(data).returning();
    return invite;
  }

  async getTeamInviteByCode(code: string): Promise<TeamInvite | undefined> {
    const [invite] = await db
      .select()
      .from(teamInvites)
      .where(eq(teamInvites.inviteCode, code));
    return invite;
  }

  async getTeamInvites(teamId: string): Promise<TeamInvite[]> {
    return await db
      .select()
      .from(teamInvites)
      .where(eq(teamInvites.teamId, teamId));
  }

  async useTeamInvite(code: string, userId: string): Promise<TeamInvite | undefined> {
    const [updated] = await db
      .update(teamInvites)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(eq(teamInvites.inviteCode, code))
      .returning();
    return updated;
  }

  async deleteTeamInvite(id: string): Promise<void> {
    await db.delete(teamInvites).where(eq(teamInvites.id, id));
  }

  // User achievement methods
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async ensureDefaultAchievementsForUser(userId: string): Promise<UserAchievement[]> {
    const existing = await this.getUserAchievements(userId);
    
    if (existing.length > 0) {
      return existing;
    }

    const defaultAchievements: InsertUserAchievement[] = [
      {
        userId,
        achievementKey: 'first-steps',
        title: 'First Steps',
        description: 'Complete your first daily check-in',
        icon: 'target',
        rarity: 'common',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
      },
      {
        userId,
        achievementKey: 'week-warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: 'flame',
        rarity: 'rare',
        unlocked: false,
        progress: 0,
        maxProgress: 7,
      },
      {
        userId,
        achievementKey: 'health-champion',
        title: 'Health Champion',
        description: 'Reach level 15',
        icon: 'crown',
        rarity: 'epic',
        unlocked: false,
        progress: 0,
        maxProgress: 15,
      },
      {
        userId,
        achievementKey: 'medication-master',
        title: 'Medication Master',
        description: 'Take all medications on time for 30 days',
        icon: 'shield',
        rarity: 'legendary',
        unlocked: false,
        progress: 0,
        maxProgress: 30,
      },
      {
        userId,
        achievementKey: 'hydration-hero',
        title: 'Hydration Hero',
        description: 'Drink 8 glasses of water for 7 days straight',
        icon: 'zap',
        rarity: 'rare',
        unlocked: false,
        progress: 0,
        maxProgress: 7,
      },
      {
        userId,
        achievementKey: 'early-bird',
        title: 'Early Bird',
        description: 'Complete a check-in before 8 AM',
        icon: 'star',
        rarity: 'common',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
      },
      {
        userId,
        achievementKey: 'heart-healthy',
        title: 'Heart Healthy',
        description: 'Complete all heart health missions',
        icon: 'heart',
        rarity: 'epic',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
      },
      {
        userId,
        achievementKey: 'community-star',
        title: 'Community Star',
        description: 'Reach top 3 in the weekly leaderboard',
        icon: 'award',
        rarity: 'legendary',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
      },
    ];

    const createdAchievements: UserAchievement[] = [];
    for (const achievement of defaultAchievements) {
      const [created] = await db
        .insert(userAchievements)
        .values(achievement)
        .returning();
      createdAchievements.push(created);
    }

    return createdAchievements;
  }

  async updateUserAchievement(id: string, data: UpdateUserAchievement): Promise<UserAchievement | undefined> {
    const [updated] = await db
      .update(userAchievements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userAchievements.id, id))
      .returning();
    return updated;
  }

  async unlockAchievement(userId: string, achievementKey: string): Promise<UserAchievement | undefined> {
    const [updated] = await db
      .update(userAchievements)
      .set({ 
        unlocked: true, 
        unlockedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementKey, achievementKey)
        )
      )
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
