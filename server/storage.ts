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
  type Mission,
  type UserMission,
  type InsertUserMission,
  type UpdateUserMission,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type TeamInvite,
  type InsertTeamInvite,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type UserActivity,
  type InsertUserActivity,
  type UpdateUserActivity,
  type OnboardingProgress,
  type UpdateOnboardingProgress,
  type UserXp,
  type InsertUserXp,
  type Medication,
  type InsertMedication,
  type UpdateMedication,
  type MedicationLog,
  type InsertMedicationLog,
  type MedicationAdherence,
  type InsertMedicationAdherence,
  type UpdateMedicationAdherence,
  users,
  questionnaireAnswers,
  userProfiles,
  userPreferences,
  userGamification,
  riskScores,
  emotionalCheckins,
  missions,
  userMissions,
  teams,
  teamMembers,
  teamInvites,
  achievements,
  userAchievements,
  userActivities,
  onboardingProgress,
  userXp,
  medications,
  medicationLogs,
  medicationAdherence,
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
  addXP(userId: string, amount: number): Promise<UserXp>;
  updateStreak(userId: string): Promise<UserGamification>;

  // User XP methods (dedicated XP table)
  getUserXp(userId: string): Promise<UserXp | undefined>;
  setUserXp(userId: string, totalXp: number): Promise<UserXp>;
  initUserXp(userId: string): Promise<UserXp>;

  // Risk score methods
  getLatestRiskScore(userId: string): Promise<RiskScore | undefined>;
  getAllRiskScores(userId: string): Promise<RiskScore[]>;
  saveRiskScore(data: InsertRiskScore): Promise<RiskScore>;

  // Emotional check-in methods
  getLatestEmotionalCheckin(userId: string): Promise<EmotionalCheckin | undefined>;
  getAllEmotionalCheckins(userId: string): Promise<EmotionalCheckin[]>;
  saveEmotionalCheckin(data: InsertEmotionalCheckin): Promise<EmotionalCheckin>;

  // Mission catalog methods
  getAllMissions(): Promise<Mission[]>;
  getBaseMissions(): Promise<Mission[]>;
  getAlternativeMissions(): Promise<Mission[]>;
  getAlternativeFor(parentMissionKey: string): Promise<Mission | undefined>;
  getMissionByKey(missionKey: string): Promise<Mission | undefined>;

  // User mission methods
  getUserMissions(userId: string): Promise<UserMission[]>;
  createUserMission(data: InsertUserMission): Promise<UserMission>;
  updateUserMission(id: string, data: UpdateUserMission): Promise<UserMission | undefined>;
  deleteUserMission(id: string): Promise<void>;
  ensureDefaultMissionsForUser(userId: string): Promise<UserMission[]>;
  resetUserMissions(userId: string): Promise<UserMission[]>;

  // Team methods
  ensureLorettaCommunity(): Promise<Team>;
  addUserToLorettaCommunity(userId: string): Promise<TeamMember | null>;
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

  // Master achievement methods
  getAllAchievements(): Promise<Achievement[]>;
  getAchievement(id: string): Promise<Achievement | undefined>;
  createAchievement(data: InsertAchievement): Promise<Achievement>;
  ensureMasterAchievements(): Promise<Achievement[]>;

  // User achievement methods
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  getUserAchievementWithDetails(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]>;
  ensureUserHasAllAchievements(userId: string): Promise<UserAchievement[]>;
  updateUserAchievementProgress(userId: string, achievementId: string, progress: number): Promise<{ updated: UserAchievement | undefined; justUnlocked: boolean; xpReward: number }>;

  // User activity methods
  getUserActivityForDate(userId: string, date: string): Promise<UserActivity | undefined>;
  getUserActivities(userId: string, days?: number): Promise<UserActivity[]>;
  saveUserActivity(data: InsertUserActivity): Promise<UserActivity>;
  updateUserActivity(userId: string, date: string, data: UpdateUserActivity): Promise<UserActivity | undefined>;

  // Onboarding progress methods
  getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(userId: string): Promise<OnboardingProgress>;
  updateOnboardingProgress(userId: string, data: UpdateOnboardingProgress): Promise<OnboardingProgress | undefined>;

  // Medication methods
  getUserMedications(userId: string): Promise<Medication[]>;
  getMedication(id: string): Promise<Medication | undefined>;
  createMedication(data: InsertMedication): Promise<Medication>;
  updateMedication(id: string, data: UpdateMedication): Promise<Medication | undefined>;
  deleteMedication(id: string): Promise<void>;

  // Medication log methods
  getMedicationLogsForDate(userId: string, date: string): Promise<MedicationLog[]>;
  getMedicationLogs(medicationId: string, limit?: number): Promise<MedicationLog[]>;
  logMedicationDose(data: InsertMedicationLog): Promise<MedicationLog>;

  // Medication adherence methods
  getMedicationAdherence(medicationId: string): Promise<MedicationAdherence | undefined>;
  updateMedicationAdherence(medicationId: string, userId: string, data: UpdateMedicationAdherence): Promise<MedicationAdherence>;
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
      // Merge incoming answers with existing answers (new answers override existing)
      const mergedAnswers = {
        ...(existing.answers as Record<string, string>),
        ...(data.answers as Record<string, string>),
      };
      const [updated] = await db
        .update(questionnaireAnswers)
        .set({ answers: mergedAnswers, updatedAt: new Date() })
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
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastCheckIn: data.lastCheckIn,
      lives: data.lives,
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

  async addXP(userId: string, amount: number): Promise<UserXp> {
    let xpRecord = await this.getUserXp(userId);
    
    if (!xpRecord) {
      xpRecord = await this.initUserXp(userId);
    }

    const newXP = (xpRecord.totalXp || 0) + amount;

    const [updated] = await db
      .update(userXp)
      .set({ totalXp: newXP, updatedAt: new Date() })
      .where(eq(userXp.id, xpRecord.id))
      .returning();

    // Ensure gamification record exists for streak tracking
    const gamification = await this.getUserGamification(userId);
    if (!gamification) {
      await this.saveUserGamification({ userId });
    }

    return updated;
  }

  async getUserXp(userId: string): Promise<UserXp | undefined> {
    const [record] = await db
      .select()
      .from(userXp)
      .where(eq(userXp.userId, userId));
    return record;
  }

  async setUserXp(userId: string, totalXpValue: number): Promise<UserXp> {
    let xpRecord = await this.getUserXp(userId);
    
    if (!xpRecord) {
      const [created] = await db
        .insert(userXp)
        .values({ userId, totalXp: totalXpValue })
        .returning();
      return created;
    }

    const [updated] = await db
      .update(userXp)
      .set({ totalXp: totalXpValue, updatedAt: new Date() })
      .where(eq(userXp.id, xpRecord.id))
      .returning();
    return updated;
  }

  async initUserXp(userId: string): Promise<UserXp> {
    const existing = await this.getUserXp(userId);
    if (existing) return existing;

    const [created] = await db
      .insert(userXp)
      .values({ userId, totalXp: 0 })
      .returning();
    return created;
  }

  async checkUserActiveToday(userId: string): Promise<boolean> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
    const endOfDay = new Date(todayStr + 'T23:59:59.999Z');

    // Check for emotional check-in today
    const latestCheckin = await this.getLatestEmotionalCheckin(userId);
    if (latestCheckin?.checkedInAt && new Date(latestCheckin.checkedInAt) >= startOfDay) {
      return true;
    }

    // Check for medication log today
    const medicationLogs = await this.getMedicationLogsForDate(userId, todayStr);
    if (medicationLogs.length > 0) {
      return true;
    }

    // Check for mission completed today
    const userMissions = await this.getUserMissions(userId);
    for (const mission of userMissions) {
      if (mission.completedAt && new Date(mission.completedAt) >= startOfDay) {
        return true;
      }
    }

    // Check if lastCheckIn from gamification is today
    const gamification = await this.getUserGamification(userId);
    if (gamification?.lastCheckIn && new Date(gamification.lastCheckIn) >= startOfDay) {
      return true;
    }

    return false;
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

  async getAllMissions(): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(eq(missions.isActive, true));
  }

  async getBaseMissions(): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(and(eq(missions.isActive, true), eq(missions.isAlternative, false)));
  }

  async getAlternativeMissions(): Promise<Mission[]> {
    return await db
      .select()
      .from(missions)
      .where(and(eq(missions.isActive, true), eq(missions.isAlternative, true)));
  }

  async getAlternativeFor(parentMissionKey: string): Promise<Mission | undefined> {
    const [mission] = await db
      .select()
      .from(missions)
      .where(and(
        eq(missions.isActive, true),
        eq(missions.isAlternative, true),
        eq(missions.alternativeOf, parentMissionKey)
      ));
    return mission;
  }

  async getMissionByKey(missionKey: string): Promise<Mission | undefined> {
    const [mission] = await db
      .select()
      .from(missions)
      .where(eq(missions.missionKey, missionKey));
    return mission;
  }

  async ensureDefaultMissionsForUser(userId: string): Promise<UserMission[]> {
    const existingMissions = await this.getUserMissions(userId);
    const baseMissions = await this.getBaseMissions();
    
    const existingKeys = existingMissions.map(m => m.missionKey);
    const missingMissions = baseMissions.filter(m => !existingKeys.includes(m.missionKey));
    
    for (const catalogMission of missingMissions) {
      const userMission: InsertUserMission = {
        userId,
        missionId: catalogMission.id,
        missionKey: catalogMission.missionKey,
        title: catalogMission.titleEn,
        description: catalogMission.descriptionEn,
        category: catalogMission.category,
        xpReward: catalogMission.xpReward,
        progress: 0,
        maxProgress: catalogMission.maxProgress || 1,
        completed: false,
        isActive: false,
      };
      const created = await this.createUserMission(userMission);
      existingMissions.push(created);
    }
    
    return existingMissions;
  }

  async resetUserMissions(userId: string): Promise<UserMission[]> {
    await db.delete(userMissions).where(eq(userMissions.userId, userId));
    return await this.ensureDefaultMissionsForUser(userId);
  }

  // Team methods
  async ensureLorettaCommunity(): Promise<Team> {
    const LORETTA_TEAM_ID = 'loretta-community';
    
    const existing = await this.getTeam(LORETTA_TEAM_ID);
    if (existing) return existing;
    
    const [team] = await db.insert(teams).values({
      id: LORETTA_TEAM_ID,
      name: 'Loretta Community',
      description: 'The official Loretta health community. Connect with other users on their wellness journey!',
      createdBy: 'system',
    }).returning();
    
    return team;
  }
  
  async addUserToLorettaCommunity(userId: string): Promise<TeamMember | null> {
    const team = await this.ensureLorettaCommunity();
    
    const existingMember = await this.getTeamMember(team.id, userId);
    if (existingMember) return existingMember;
    
    const member = await this.addTeamMember({
      teamId: team.id,
      userId,
      role: 'member',
      consentGiven: true,
      consentDate: new Date(),
    });
    
    return member;
  }
  
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

  // Master achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id));
    return achievement;
  }

  async createAchievement(data: InsertAchievement): Promise<Achievement> {
    const [created] = await db
      .insert(achievements)
      .values(data)
      .returning();
    return created;
  }

  async ensureMasterAchievements(): Promise<Achievement[]> {
    const healthWellnessAchievements: InsertAchievement[] = [
      {
        id: 'daily-dedication',
        title: 'Daily Dedication',
        description: 'Complete your first daily health check-in to start your wellness journey',
        icon: 'target',
        rarity: 'common',
        maxProgress: 1,
        xpReward: 50,
        category: 'checkin',
        sortOrder: 1,
      },
      {
        id: 'hydration-champion',
        title: 'Hydration Champion',
        description: 'Meet your daily water intake goal for 7 consecutive days',
        icon: 'zap',
        rarity: 'rare',
        maxProgress: 7,
        xpReward: 200,
        category: 'health',
        sortOrder: 2,
      },
      {
        id: 'sleep-master',
        title: 'Sleep Master',
        description: 'Achieve 7-8 hours of quality sleep for 5 nights in a row',
        icon: 'star',
        rarity: 'rare',
        maxProgress: 5,
        xpReward: 175,
        category: 'health',
        sortOrder: 3,
      },
      {
        id: 'step-champion',
        title: 'Step Champion',
        description: 'Reach your daily step goal for 10 days total',
        icon: 'flame',
        rarity: 'epic',
        maxProgress: 10,
        xpReward: 300,
        category: 'health',
        sortOrder: 4,
      },
      {
        id: 'medication-adherence',
        title: 'Medication Adherence',
        description: 'Take all medications on schedule for 14 consecutive days',
        icon: 'shield',
        rarity: 'epic',
        maxProgress: 14,
        xpReward: 400,
        category: 'health',
        sortOrder: 5,
      },
      {
        id: 'streak-legend',
        title: 'Streak Legend',
        description: 'Maintain a 30-day check-in streak without missing a day',
        icon: 'crown',
        rarity: 'legendary',
        maxProgress: 30,
        xpReward: 1000,
        category: 'streak',
        sortOrder: 6,
      },
      {
        id: 'wellness-warrior',
        title: 'Wellness Warrior',
        description: 'Earn 5000 total XP through consistent healthy behaviors',
        icon: 'award',
        rarity: 'legendary',
        maxProgress: 5000,
        xpReward: 750,
        category: 'level',
        sortOrder: 8,
      },
      {
        id: 'community-star',
        title: 'Community Star',
        description: 'Reach the top 3 on the Loretta community leaderboard (requires 5+ members)',
        icon: 'star',
        rarity: 'epic',
        maxProgress: 1,
        xpReward: 300,
        category: 'community',
        sortOrder: 9,
      },
    ];

    const existing = await this.getAllAchievements();
    const existingIds = new Set(existing.map(a => a.id));
    
    const createdAchievements: Achievement[] = [...existing];
    
    for (const achievement of healthWellnessAchievements) {
      if (!existingIds.has(achievement.id)) {
        const [created] = await db
          .insert(achievements)
          .values(achievement)
          .returning();
        createdAchievements.push(created);
      }
    }

    return createdAchievements;
  }

  async syncMasterAchievements(): Promise<Achievement[]> {
    const healthWellnessAchievements: InsertAchievement[] = [
      {
        id: 'daily-dedication',
        title: 'Daily Dedication',
        description: 'Complete your first daily health check-in to start your wellness journey',
        icon: 'target',
        rarity: 'common',
        maxProgress: 1,
        xpReward: 50,
        category: 'checkin',
        sortOrder: 1,
      },
      {
        id: 'hydration-champion',
        title: 'Hydration Champion',
        description: 'Meet your daily water intake goal for 7 consecutive days',
        icon: 'zap',
        rarity: 'rare',
        maxProgress: 7,
        xpReward: 200,
        category: 'health',
        sortOrder: 2,
      },
      {
        id: 'sleep-master',
        title: 'Sleep Master',
        description: 'Achieve 7-8 hours of quality sleep for 5 nights in a row',
        icon: 'star',
        rarity: 'rare',
        maxProgress: 5,
        xpReward: 175,
        category: 'health',
        sortOrder: 3,
      },
      {
        id: 'step-champion',
        title: 'Step Champion',
        description: 'Reach your daily step goal for 10 days total',
        icon: 'flame',
        rarity: 'epic',
        maxProgress: 10,
        xpReward: 300,
        category: 'health',
        sortOrder: 4,
      },
      {
        id: 'medication-adherence',
        title: 'Medication Adherence',
        description: 'Take all medications on schedule for 14 consecutive days',
        icon: 'shield',
        rarity: 'epic',
        maxProgress: 14,
        xpReward: 400,
        category: 'health',
        sortOrder: 5,
      },
      {
        id: 'streak-legend',
        title: 'Streak Legend',
        description: 'Maintain a 30-day check-in streak without missing a day',
        icon: 'crown',
        rarity: 'legendary',
        maxProgress: 30,
        xpReward: 1000,
        category: 'streak',
        sortOrder: 6,
      },
      {
        id: 'wellness-warrior',
        title: 'Wellness Warrior',
        description: 'Earn 5000 total XP through consistent healthy behaviors',
        icon: 'award',
        rarity: 'legendary',
        maxProgress: 5000,
        xpReward: 750,
        category: 'level',
        sortOrder: 8,
      },
      {
        id: 'community-star',
        title: 'Community Star',
        description: 'Reach the top 3 on the Loretta community leaderboard (requires 5+ members)',
        icon: 'star',
        rarity: 'epic',
        maxProgress: 1,
        xpReward: 300,
        category: 'community',
        sortOrder: 9,
      },
    ];

    for (const achievement of healthWellnessAchievements) {
      const existing = await this.getAchievement(achievement.id);
      if (existing) {
        await db
          .update(achievements)
          .set({
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            rarity: achievement.rarity,
            maxProgress: achievement.maxProgress,
            xpReward: achievement.xpReward,
            category: achievement.category,
            sortOrder: achievement.sortOrder,
          })
          .where(eq(achievements.id, achievement.id));
      } else {
        await db
          .insert(achievements)
          .values(achievement);
      }
    }

    return await this.getAllAchievements();
  }

  // User achievement methods
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async getUserAchievementWithDetails(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchs = await this.getUserAchievements(userId);
    const allAchs = await this.getAllAchievements();
    
    const achMap = new Map(allAchs.map(a => [a.id, a]));
    
    return userAchs
      .map(ua => {
        const achievement = achMap.get(ua.achievementId);
        if (!achievement) return null;
        return { ...ua, achievement };
      })
      .filter((item): item is (UserAchievement & { achievement: Achievement }) => item !== null);
  }

  async ensureUserHasAllAchievements(userId: string): Promise<UserAchievement[]> {
    await this.ensureMasterAchievements();
    
    const allAchievements = await this.getAllAchievements();
    const existingUserAchievements = await this.getUserAchievements(userId);
    
    const existingAchievementIds = new Set(existingUserAchievements.map(ua => ua.achievementId));
    
    const missingAchievements = allAchievements.filter(a => !existingAchievementIds.has(a.id));
    
    for (const achievement of missingAchievements) {
      await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId: achievement.id,
          progress: 0,
          unlocked: false,
        });
    }
    
    return await this.getUserAchievements(userId);
  }

  async updateUserAchievementProgress(userId: string, achievementId: string, progress: number): Promise<{ updated: UserAchievement | undefined; justUnlocked: boolean; xpReward: number }> {
    const achievement = await this.getAchievement(achievementId);
    if (!achievement) return { updated: undefined, justUnlocked: false, xpReward: 0 };
    
    // Get current state to detect if it was already unlocked
    const [current] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
    
    const wasAlreadyUnlocked = current?.unlocked || false;
    const isComplete = progress >= (achievement.maxProgress || 1);
    const justUnlocked = isComplete && !wasAlreadyUnlocked;
    
    // Achievements stay permanently unlocked once earned (never re-lock)
    const shouldBeUnlocked = wasAlreadyUnlocked || isComplete;
    
    const [updated] = await db
      .update(userAchievements)
      .set({ 
        progress: Math.max(progress, current?.progress || 0), // Progress only increases
        unlocked: shouldBeUnlocked,
        unlockedAt: justUnlocked ? new Date() : current?.unlockedAt,
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      )
      .returning();
    
    // Award XP only on first unlock (atomic check via justUnlocked flag)
    if (justUnlocked) {
      await this.addXP(userId, achievement.xpReward || 50);
    }
    
    return { updated, justUnlocked, xpReward: justUnlocked ? (achievement.xpReward || 50) : 0 };
  }

  // User activity methods
  async getUserActivityForDate(userId: string, date: string): Promise<UserActivity | undefined> {
    const [activity] = await db
      .select()
      .from(userActivities)
      .where(
        and(
          eq(userActivities.userId, userId),
          eq(userActivities.date, date)
        )
      );
    return activity;
  }

  async getUserActivities(userId: string, days: number = 7): Promise<UserActivity[]> {
    return await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.date))
      .limit(days);
  }

  async saveUserActivity(data: InsertUserActivity): Promise<UserActivity> {
    const existing = await this.getUserActivityForDate(data.userId, data.date);

    if (existing) {
      const [updated] = await db
        .update(userActivities)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userActivities.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userActivities)
        .values(data)
        .returning();
      return created;
    }
  }

  async updateUserActivity(userId: string, date: string, data: UpdateUserActivity): Promise<UserActivity | undefined> {
    const existing = await this.getUserActivityForDate(userId, date);

    if (existing) {
      const [updated] = await db
        .update(userActivities)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userActivities.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userActivities)
        .values({
          userId,
          date,
          ...data,
        })
        .returning();
      return created;
    }
  }

  // Onboarding progress methods
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId));
    return progress;
  }

  async createOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const existing = await this.getOnboardingProgress(userId);
    if (existing) {
      return existing;
    }
    
    const [created] = await db
      .insert(onboardingProgress)
      .values({
        userId,
        accountCreated: true,
        accountCreatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async updateOnboardingProgress(userId: string, data: UpdateOnboardingProgress): Promise<OnboardingProgress | undefined> {
    const existing = await this.getOnboardingProgress(userId);
    
    if (existing) {
      const [updated] = await db
        .update(onboardingProgress)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(onboardingProgress.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(onboardingProgress)
        .values({
          userId,
          ...data,
        })
        .returning();
      return created;
    }
  }

  // Medication methods
  async getUserMedications(userId: string): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.isActive, true)))
      .orderBy(desc(medications.createdAt));
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const [medication] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, id));
    return medication;
  }

  async createMedication(data: InsertMedication): Promise<Medication> {
    const [created] = await db
      .insert(medications)
      .values(data as typeof medications.$inferInsert)
      .returning();
    
    // Initialize adherence record
    await db.insert(medicationAdherence).values({
      medicationId: created.id,
      userId: data.userId,
      currentStreak: 0,
      longestStreak: 0,
      totalDosesTaken: 0,
      totalDosesScheduled: 0,
    });
    
    return created;
  }

  async updateMedication(id: string, data: UpdateMedication): Promise<Medication | undefined> {
    const [updated] = await db
      .update(medications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(medications.id, id))
      .returning();
    return updated;
  }

  async deleteMedication(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    await db
      .update(medications)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(medications.id, id));
  }

  // Medication log methods
  async getMedicationLogsForDate(userId: string, date: string): Promise<MedicationLog[]> {
    return await db
      .select()
      .from(medicationLogs)
      .where(and(
        eq(medicationLogs.userId, userId),
        eq(medicationLogs.scheduledDate, date)
      ))
      .orderBy(desc(medicationLogs.takenAt));
  }

  async getMedicationLogs(medicationId: string, limit: number = 30): Promise<MedicationLog[]> {
    return await db
      .select()
      .from(medicationLogs)
      .where(eq(medicationLogs.medicationId, medicationId))
      .orderBy(desc(medicationLogs.takenAt))
      .limit(limit);
  }

  async logMedicationDose(data: InsertMedicationLog): Promise<MedicationLog> {
    const [log] = await db
      .insert(medicationLogs)
      .values(data)
      .returning();
    
    // Update adherence stats
    await this.updateMedicationAdherence(data.medicationId, data.userId, {
      totalDosesTaken: 1, // Will be incremented
      lastTakenDate: data.scheduledDate,
    });
    
    return log;
  }

  async undoMedicationDose(logId: string, medicationId: string): Promise<boolean> {
    // Delete the log entry
    const deleted = await db
      .delete(medicationLogs)
      .where(eq(medicationLogs.id, logId))
      .returning();
    
    if (deleted.length === 0) {
      return false;
    }
    
    // Recalculate adherence stats based on remaining logs
    const existing = await this.getMedicationAdherence(medicationId);
    if (existing) {
      // Get the most recent remaining log to determine lastTakenDate
      const remainingLogs = await db
        .select()
        .from(medicationLogs)
        .where(eq(medicationLogs.medicationId, medicationId))
        .orderBy(desc(medicationLogs.scheduledDate))
        .limit(1);
      
      const newLastTakenDate = remainingLogs.length > 0 ? remainingLogs[0].scheduledDate : null;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Recalculate streak based on remaining data
      let newStreak = existing.currentStreak;
      
      // If we removed the dose that was keeping the streak, we need to recalculate
      if (!newLastTakenDate) {
        // No more logs, reset streak
        newStreak = 0;
      } else if (newLastTakenDate !== today && newLastTakenDate !== yesterdayStr) {
        // The most recent remaining dose is too old, streak is broken
        newStreak = 0;
      }
      // If still has recent doses, keep current streak (might be slightly off but acceptable)
      
      await db
        .update(medicationAdherence)
        .set({
          totalDosesTaken: Math.max(0, existing.totalDosesTaken - 1),
          lastTakenDate: newLastTakenDate,
          currentStreak: newStreak,
          updatedAt: new Date(),
        })
        .where(eq(medicationAdherence.medicationId, medicationId));
    }
    
    return true;
  }

  // Medication adherence methods
  async getMedicationAdherence(medicationId: string): Promise<MedicationAdherence | undefined> {
    const [adherence] = await db
      .select()
      .from(medicationAdherence)
      .where(eq(medicationAdherence.medicationId, medicationId));
    return adherence;
  }

  async updateMedicationAdherence(medicationId: string, userId: string, data: UpdateMedicationAdherence): Promise<MedicationAdherence> {
    const existing = await this.getMedicationAdherence(medicationId);
    const today = new Date().toISOString().split('T')[0];
    
    if (existing) {
      // Calculate streak
      let newStreak = existing.currentStreak;
      let newLongestStreak = existing.longestStreak;
      
      if (data.lastTakenDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (existing.lastTakenDate === yesterdayStr || existing.lastTakenDate === today) {
          // Continue streak
          if (existing.lastTakenDate !== today) {
            newStreak = existing.currentStreak + 1;
          }
        } else if (!existing.lastTakenDate) {
          // First dose ever
          newStreak = 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
        
        if (newStreak > newLongestStreak) {
          newLongestStreak = newStreak;
        }
      }
      
      const [updated] = await db
        .update(medicationAdherence)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          totalDosesTaken: existing.totalDosesTaken + (data.totalDosesTaken || 0),
          totalDosesScheduled: existing.totalDosesScheduled + (data.totalDosesScheduled || 0),
          lastTakenDate: data.lastTakenDate || existing.lastTakenDate,
          updatedAt: new Date(),
        })
        .where(eq(medicationAdherence.medicationId, medicationId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(medicationAdherence)
        .values({
          medicationId,
          userId,
          currentStreak: 1,
          longestStreak: 1,
          totalDosesTaken: data.totalDosesTaken || 0,
          totalDosesScheduled: data.totalDosesScheduled || 0,
          lastTakenDate: data.lastTakenDate,
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
