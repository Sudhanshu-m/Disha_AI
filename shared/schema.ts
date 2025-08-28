import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * USERS TABLE
 */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

/**
 * STUDENT PROFILES TABLE
 * (Links to users by userId)
 */
export const studentProfiles = pgTable("student_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  educationLevel: text("education_level").notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  gpa: text("gpa"),
  graduationYear: text("graduation_year").notNull(),
  skills: text("skills"),
  activities: text("activities"),
  financialNeed: text("financial_need").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

/**
 * SCHOLARSHIPS TABLE
 */
export const scholarships = pgTable("scholarships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  amount: text("amount").notNull(),
  deadline: text("deadline").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  tags: text("tags").array().notNull(),
  type: text("type").notNull(), // merit-based, need-based, field-specific, etc.
  eligibilityGpa: text("eligibility_gpa"),
  eligibleFields: text("eligible_fields").array(),
  eligibleLevels: text("eligible_levels").array(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

/**
 * SCHOLARSHIP MATCHES TABLE
 * (Links studentProfiles ↔ scholarships)
 */
export const scholarshipMatches = pgTable("scholarship_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .references(() => studentProfiles.id)
    .notNull(),
  scholarshipId: varchar("scholarship_id")
    .references(() => scholarships.id)
    .notNull(),
  matchScore: integer("match_score").notNull(),
  aiReasoning: text("ai_reasoning"),
  status: text("status").default("new").notNull(), // new, favorited, applied, rejected
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

/**
 * APPLICATION GUIDANCE TABLE
 * (Links studentProfiles ↔ scholarships)
 */
export const applicationGuidance = pgTable("application_guidance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .references(() => studentProfiles.id)
    .notNull(),
  scholarshipId: varchar("scholarship_id")
    .references(() => scholarships.id)
    .notNull(),
  essayTips: text("essay_tips").array(),   // ✅ now a string[]
  checklist: text("checklist").array(),    // ✅ now a string[]
  improvementSuggestions: text("improvement_suggestions").array(), // ✅ string[]
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

/**
 * Zod Schemas for Validation
 */
export const insertUserSchema = createInsertSchema(users);

export const insertStudentProfileSchema = createInsertSchema(
  studentProfiles
).omit({
  id: true,
  userId: true, // will be set in backend from logged-in user
  createdAt: true,
  updatedAt: true,
});

export const insertScholarshipSchema = createInsertSchema(scholarships).omit({
  id: true,
  createdAt: true,
});

export const insertScholarshipMatchSchema = createInsertSchema(
  scholarshipMatches
).omit({
  id: true,
  createdAt: true,
});

export const insertApplicationGuidanceSchema = createInsertSchema(
  applicationGuidance
).omit({
  id: true,
  createdAt: true,
});

/**
 * TypeScript Types
 */
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;

export type Scholarship = typeof scholarships.$inferSelect;
export type InsertScholarship = z.infer<typeof insertScholarshipSchema>;

export type ScholarshipMatch = typeof scholarshipMatches.$inferSelect;
export type InsertScholarshipMatch = z.infer<typeof insertScholarshipMatchSchema>;

export type ApplicationGuidance = typeof applicationGuidance.$inferSelect;
export type InsertApplicationGuidance = z.infer<typeof insertApplicationGuidanceSchema>;
