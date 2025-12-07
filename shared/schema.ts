import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// User gamification data - stores XP, level, streak, achievements
export const userGamification = pgTable("user_gamification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastCheckIn: timestamp("last_check_in"),
  lives: integer("lives").default(5),
  achievements: jsonb("achievements").$type<string[]>().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserGamificationSchema = createInsertSchema(userGamification).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserGamification = z.infer<typeof insertUserGamificationSchema>;
export type UserGamification = typeof userGamification.$inferSelect;

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

// User missions table - stores per-user mission/quest data
export const userMissions = pgTable("user_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  missionKey: text("mission_key").notNull(), // unique identifier for the mission type
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'daily', 'weekly', 'bonus'
  xpReward: integer("xp_reward").default(0),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").default(1),
  completed: boolean("completed").default(false),
  legendary: boolean("legendary").default(false),
  href: text("href"),
  source: text("source").default("default"), // 'default', 'activity', 'chat'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserMissionSchema = createInsertSchema(userMissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserMissionSchema = z.object({
  progress: z.number().optional(),
  completed: z.boolean().optional(),
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

// User achievements table - stores per-user achievement progress
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  achievementKey: text("achievement_key").notNull(), // unique identifier for achievement type
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // 'target', 'flame', 'crown', 'star', 'zap', 'heart', 'shield', 'award'
  rarity: text("rarity").notNull(), // 'common', 'rare', 'epic', 'legendary'
  unlocked: boolean("unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserAchievementSchema = z.object({
  progress: z.number().optional(),
  unlocked: z.boolean().optional(),
  unlockedAt: z.date().optional(),
});

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UpdateUserAchievement = z.infer<typeof updateUserAchievementSchema>;
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
