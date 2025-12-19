import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, real, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Questionnaire answers table - stores user responses
export const questionnaireAnswers = pgTable("questionnaire_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  category: text("category").notNull(), // 'onboarding', 'diet', 'sleep', 'stress'
  answers: jsonb("answers").notNull().$type<Record<string, string>>(), // { questionId: answer }
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuestionnaireSchema = createInsertSchema(questionnaireAnswers).omit({
  id: true,
  updatedAt: true,
});

export type InsertQuestionnaireAnswers = z.infer<typeof insertQuestionnaireSchema>;
export type QuestionnaireAnswers = typeof questionnaireAnswers.$inferSelect;

// User profile table - stores profile information
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  age: text("age"),
  height: text("height"),
  weight: text("weight"),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  ethnicity: text("ethnicity"),
  socioeconomicStatus: text("socioeconomic_status"),
  educationLevel: text("education_level"),
  employmentStatus: text("employment_status"),
  housingStatus: text("housing_status"),
  profilePhoto: text("profile_photo"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// User preferences table - stores consent, newsletter, theme, language settings
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  consentAccepted: boolean("consent_accepted").default(false),
  consentDate: timestamp("consent_date"),
  newsletterSubscribed: boolean("newsletter_subscribed").default(false),
  theme: text("theme").default("light"), // 'light' or 'dark'
  language: text("language").default("en"), // 'en' or 'de'
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences, {
  consentDate: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return null;
      if (val instanceof Date) return val;
      if (typeof val === 'string') {
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    },
    z.date().nullable().optional()
  ),
}).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// User gamification data - stores streak, lives (XP is in user_xp, achievements in user_achievements)
export const userGamification = pgTable("user_gamification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastCheckIn: timestamp("last_check_in"),
  lives: integer("lives").default(5),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserGamificationSchema = createInsertSchema(userGamification).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserGamification = z.infer<typeof insertUserGamificationSchema>;
export type UserGamification = typeof userGamification.$inferSelect;

// User XP table - dedicated table for tracking user XP totals
export const userXp = pgTable("user_xp", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  totalXp: integer("total_xp").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserXpSchema = createInsertSchema(userXp).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserXp = z.infer<typeof insertUserXpSchema>;
export type UserXp = typeof userXp.$inferSelect;

// Risk scores table - stores calculated health risk scores
export const riskScores = pgTable("risk_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  overallScore: real("overall_score"),
  diabetesRisk: real("diabetes_risk"),
  heartRisk: real("heart_risk"),
  strokeRisk: real("stroke_risk"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({
  id: true,
  calculatedAt: true,
});

export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;
export type RiskScore = typeof riskScores.$inferSelect;

// Emotional check-ins table - stores user emotional check-ins
export const emotionalCheckins = pgTable("emotional_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  emotion: text("emotion").notNull(), // 'happy', 'stressed', 'sad', 'tired', etc.
  userMessage: text("user_message"), // what the user said
  aiResponse: text("ai_response"), // supportive message from AI
  xpAwarded: integer("xp_awarded").default(10),
  checkedInAt: timestamp("checked_in_at").defaultNow(),
});

export const insertEmotionalCheckinSchema = createInsertSchema(emotionalCheckins).omit({
  id: true,
  checkedInAt: true,
});

export type InsertEmotionalCheckin = z.infer<typeof insertEmotionalCheckinSchema>;
export type EmotionalCheckin = typeof emotionalCheckins.$inferSelect;

// Missions catalog table - stores all available missions (master list)
export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  missionKey: text("mission_key").notNull().unique(), // unique identifier like 'jumping-jacks'
  titleEn: text("title_en").notNull(), // English title
  titleDe: text("title_de").notNull(), // German title
  descriptionEn: text("description_en"), // English description
  descriptionDe: text("description_de"), // German description
  category: text("category").notNull().default("daily"), // 'daily', 'weekly', 'bonus'
  xpReward: integer("xp_reward").default(0),
  maxProgress: integer("max_progress").default(1), // default steps to complete
  icon: text("icon").default("target"), // icon name for frontend
  color: text("color").default("chart-1"), // color theme
  isActive: boolean("is_active").default(true), // whether mission is available in catalog
  alternativeOf: text("alternative_of"), // missionKey of parent mission (null if not an alternative)
  isAlternative: boolean("is_alternative").default(false), // true if this is a low-mood alternative
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

// User missions table - stores per-user mission activation and progress
export const userMissions = pgTable("user_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  missionKey: text("mission_key").notNull(), // denormalized for quick access
  title: text("title").notNull(), // mission title for display
  description: text("description"), // mission description
  category: text("category").notNull().default("daily"), // mission category
  xpReward: integer("xp_reward"), // XP earned on completion
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").default(1), // can override mission default
  completed: boolean("completed").default(false),
  legendary: boolean("legendary").default(false), // special achievement
  href: text("href"), // link to mission details
  source: text("source").default("default"), // where mission came from
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(false), // whether user has activated this mission
  missionId: text("mission_id"), // references missions.id (optional for legacy)
  activatedAt: timestamp("activated_at"), // when user activated the mission
  completedAt: timestamp("completed_at"), // when mission was completed
});

export const insertUserMissionSchema = createInsertSchema(userMissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserMissionSchema = z.object({
  progress: z.number().optional(),
  completed: z.boolean().optional(),
  isActive: z.boolean().optional(),
  activatedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
});

export type InsertUserMission = z.infer<typeof insertUserMissionSchema>;
export type UpdateUserMission = z.infer<typeof updateUserMissionSchema>;
export type UserMission = typeof userMissions.$inferSelect;

// Teams table - stores team info (family, friends groups)
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(), // userId of team creator
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Team members table - stores team memberships
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").default("member"), // 'owner', 'admin', 'member'
  consentGiven: boolean("consent_given").default(false), // user agreed to share stats
  consentDate: timestamp("consent_date"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Team invites table - stores pending invitations
export const teamInvites = pgTable("team_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull(),
  inviteCode: text("invite_code").notNull().unique(), // short unique code for link/QR
  createdBy: text("created_by").notNull(), // userId who created invite
  expiresAt: timestamp("expires_at"), // optional expiration
  usedBy: text("used_by"), // userId who used the invite (null if unused)
  usedAt: timestamp("used_at"), // when invite was used
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamInviteSchema = createInsertSchema(teamInvites).omit({
  id: true,
  usedBy: true,
  usedAt: true,
  createdAt: true,
});

export type InsertTeamInvite = z.infer<typeof insertTeamInviteSchema>;
export type TeamInvite = typeof teamInvites.$inferSelect;

// Master achievements table - defines all available achievements
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey(), // e.g., 'first_checkin', 'streak_7', 'level_10'
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // 'target', 'flame', 'crown', 'star', 'zap', 'heart', 'shield', 'award'
  rarity: text("rarity").notNull(), // 'common', 'rare', 'epic', 'legendary'
  maxProgress: integer("max_progress").default(1), // how many steps to complete
  xpReward: integer("xp_reward").default(50), // XP awarded on completion
  category: text("category").default('general'), // 'streak', 'checkin', 'level', 'health', 'social'
  sortOrder: integer("sort_order").default(0), // for display ordering
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  createdAt: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// User achievements table - stores per-user achievement progress
// Every user has an entry for EVERY achievement with their progress
// Unique constraint on (userId, achievementId) prevents duplicate entries
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  achievementId: text("achievement_id").notNull(), // references achievements.id
  progress: integer("progress").default(0), // current progress (0 to maxProgress)
  unlocked: boolean("unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userAchievementUnique: unique().on(table.userId, table.achievementId),
}));

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// User activities table - stores daily activity metrics (steps, sleep, heart rate, calories)
export const userActivities = pgTable("user_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format for easy querying
  steps: integer("steps").default(0),
  stepsGoal: integer("steps_goal").default(10000),
  sleepHours: real("sleep_hours").default(0),
  sleepGoal: real("sleep_goal").default(8),
  heartRate: integer("heart_rate"), // resting heart rate in bpm
  calories: integer("calories").default(0),
  caloriesGoal: integer("calories_goal").default(2000),
  water: integer("water").default(0), // glasses of water
  waterGoal: integer("water_goal").default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserActivitySchema = z.object({
  steps: z.number().optional(),
  stepsGoal: z.number().optional(),
  sleepHours: z.number().optional(),
  sleepGoal: z.number().optional(),
  heartRate: z.number().optional(),
  calories: z.number().optional(),
  caloriesGoal: z.number().optional(),
  water: z.number().optional(),
  waterGoal: z.number().optional(),
});

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UpdateUserActivity = z.infer<typeof updateUserActivitySchema>;
export type UserActivity = typeof userActivities.$inferSelect;

// Onboarding progress table - tracks signup flow completion
export const onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  accountCreated: boolean("account_created").default(false),
  accountCreatedAt: timestamp("account_created_at"),
  consentCompleted: boolean("consent_completed").default(false),
  consentCompletedAt: timestamp("consent_completed_at"),
  questionnaireCompleted: boolean("questionnaire_completed").default(false),
  questionnaireCompletedAt: timestamp("questionnaire_completed_at"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOnboardingProgressSchema = z.object({
  accountCreated: z.boolean().optional(),
  accountCreatedAt: z.date().optional(),
  consentCompleted: z.boolean().optional(),
  consentCompletedAt: z.date().optional(),
  questionnaireCompleted: z.boolean().optional(),
  questionnaireCompletedAt: z.date().optional(),
  onboardingComplete: z.boolean().optional(),
  onboardingCompletedAt: z.date().optional(),
});

export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;
export type UpdateOnboardingProgress = z.infer<typeof updateOnboardingProgressSchema>;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// Medications table - stores user's medications
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  timing: text("timing").notNull(), // Legacy field kept for database compatibility
  frequency: text("frequency").notNull(), // 'daily', 'weekly', 'as-needed'
  dosesPerDay: integer("doses_per_day").default(1).notNull(),
  xpPerDose: integer("xp_per_dose").default(10).notNull(),
  explanation: text("explanation"), // Medical explanation
  simpleExplanation: text("simple_explanation"), // Simple explanation for health literacy
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  scheduledTimes: jsonb("scheduled_times").$type<string[]>().default([]).notNull(), // Array of times like ["08:00", "14:00", "20:00"] or ["monday:08:00"]
  notes: text("notes"), // Special notes like "take with food", "avoid dairy", etc.
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMedicationSchema = z.object({
  name: z.string().optional(),
  dosage: z.string().optional(),
  scheduledTimes: z.array(z.string()).optional(),
  notes: z.string().optional(),
  frequency: z.string().optional(),
  dosesPerDay: z.number().optional(),
  xpPerDose: z.number().optional(),
  explanation: z.string().optional(),
  simpleExplanation: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type UpdateMedication = z.infer<typeof updateMedicationSchema>;
export type Medication = typeof medications.$inferSelect;

// Medication logs table - tracks when doses are taken
export const medicationLogs = pgTable("medication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicationId: text("medication_id").notNull(),
  userId: text("user_id").notNull(),
  doseNumber: integer("dose_number").default(1).notNull(), // Which dose of the day (1st, 2nd, etc.)
  takenAt: timestamp("taken_at").defaultNow(),
  scheduledDate: text("scheduled_date").notNull(), // Date string for the day (YYYY-MM-DD)
  xpAwarded: integer("xp_awarded").default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMedicationLogSchema = createInsertSchema(medicationLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertMedicationLog = z.infer<typeof insertMedicationLogSchema>;
export type MedicationLog = typeof medicationLogs.$inferSelect;

// Medication adherence stats - aggregated adherence tracking
export const medicationAdherence = pgTable("medication_adherence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicationId: text("medication_id").notNull(),
  userId: text("user_id").notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalDosesTaken: integer("total_doses_taken").default(0).notNull(),
  totalDosesScheduled: integer("total_doses_scheduled").default(0).notNull(),
  lastTakenDate: text("last_taken_date"), // Date string (YYYY-MM-DD)
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMedicationAdherenceSchema = createInsertSchema(medicationAdherence).omit({
  id: true,
  updatedAt: true,
});

export const updateMedicationAdherenceSchema = z.object({
  currentStreak: z.number().optional(),
  longestStreak: z.number().optional(),
  totalDosesTaken: z.number().optional(),
  totalDosesScheduled: z.number().optional(),
  lastTakenDate: z.string().optional(),
});

export type InsertMedicationAdherence = z.infer<typeof insertMedicationAdherenceSchema>;
export type UpdateMedicationAdherence = z.infer<typeof updateMedicationAdherenceSchema>;
export type MedicationAdherence = typeof medicationAdherence.$inferSelect;

// User invite codes - unique invitation codes for friend system
export const userInviteCodes = pgTable("user_invite_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserInviteCodeSchema = createInsertSchema(userInviteCodes).omit({
  id: true,
  createdAt: true,
});

export type InsertUserInviteCode = z.infer<typeof insertUserInviteCodeSchema>;
export type UserInviteCode = typeof userInviteCodes.$inferSelect;

// Friendships - stores friend relationships between users
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  friendId: text("friend_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("unique_friendship").on(table.userId, table.friendId),
]);

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;
