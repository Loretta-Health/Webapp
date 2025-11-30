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
  consentDate: z.union([z.date(), z.string().transform((s) => s ? new Date(s) : null), z.null()]).optional(),
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
