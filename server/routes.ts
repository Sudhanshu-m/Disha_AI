import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";

import { db } from "./db"; // <- uses server/db.ts (no new folder)
import {
  studentProfiles,
  scholarships,
  scholarshipMatches,
  applicationGuidance,
  users,
  insertStudentProfileSchema,
  type InsertScholarship,
  type InsertUser,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateScholarshipMatches,
  generateApplicationGuidance,
} from "./services/gemini";

/** utility */
function ensureArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  return [String(val)];
}

/** Try to extract textual content from several possible AI response shapes */
function extractAiTextFromResp(data: any): string {
  // common shapes:
  // - { candidates: [{ content: { parts: [{ text: "..." }] } }] }
  // - { response: { output: [{ content: [{ text: "..." }] }] } }
  // - { output: [{ content: [{ text: "..." }] }] }
  try {
    if (!data) return "";
    // candidates style
    const cand =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.[0]?.text;
    if (cand) return cand;

    // response.output style
    const out1 = data?.response?.output?.[0]?.content?.[0]?.text;
    if (out1) return out1;

    // generic output
    const out2 = data?.output?.[0]?.content?.[0]?.text;
    if (out2) return out2;

    // fallback to first stringy field
    const str = JSON.stringify(data);
    return str;
  } catch (e) {
    return "";
  }
}

/** Ask the Generative API to suggest scholarships for a profile.
 *  Returns an array of objects (best-effort). If AI fails, returns [].
 */
async function fetchScholarshipsFromAI(profile: any): Promise<InsertScholarship[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return [];

  // prompt — ask for strict JSON array of scholarship objects
  const prompt = `Return an array (strict JSON) of 6 scholarships relevant for the following student profile.
Return each entry with these fields:
title, organization, amount, deadline, description, requirements, tags (array), type, eligibilityGpa, eligibleFields (array), eligibleLevels (array), isActive (boolean).

Student profile:
${JSON.stringify(profile)}
Only return JSON (do not add commentary).`;

  try {
    // Node 18+ has global fetch. Render Node 22 supports global fetch.
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
      apiKey;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data: any = await resp.json();
    const rawText = extractAiTextFromResp(data);

    // Clean up surrounding text and try to parse JSON block
    // attempt direct parse
    try {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        // Map/normalize to InsertScholarship shape
        const mapToInsert = parsed.map((p: any) => ({
          title: String(p.title ?? p.name ?? "Untitled Scholarship"),
          organization: String(p.organization ?? p.provider ?? "Unknown"),
          amount: String(p.amount ?? p.value ?? "TBD"),
          deadline: String(p.deadline ?? ""),
          description: String(p.description ?? ""),
          requirements: String(p.requirements ?? ""),
          tags: Array.isArray(p.tags) ? p.tags.map(String) : ensureArray(p.tags),
          type: String(p.type ?? "other"),
          eligibilityGpa: String(p.eligibilityGpa ?? p.gpa ?? ""),
          eligibleFields: Array.isArray(p.eligibleFields) ? p.eligibleFields.map(String) : ensureArray(p.eligibleFields ?? p.fields),
          eligibleLevels: Array.isArray(p.eligibleLevels) ? p.eligibleLevels.map(String) : ensureArray(p.eligibleLevels ?? p.levels),
          isActive: typeof p.isActive === "boolean" ? p.isActive : true,
        })) as InsertScholarship[];
        return mapToInsert;
      }
    } catch (err) {
      // Try to extract JSON substring using regex (first {...} or [...] block)
      const jsonMatch = rawText.match(/(\[.*\])/s) || rawText.match(/(\{.*\})/s);
      if (jsonMatch) {
        try {
          const parsed2 = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed2)) {
            return parsed2.map((p: any) => ({
              title: String(p.title ?? p.name ?? "Untitled Scholarship"),
              organization: String(p.organization ?? p.provider ?? "Unknown"),
              amount: String(p.amount ?? p.value ?? "TBD"),
              deadline: String(p.deadline ?? ""),
              description: String(p.description ?? ""),
              requirements: String(p.requirements ?? ""),
              tags: Array.isArray(p.tags) ? p.tags.map(String) : ensureArray(p.tags),
              type: String(p.type ?? "other"),
              eligibilityGpa: String(p.eligibilityGpa ?? p.gpa ?? ""),
              eligibleFields: Array.isArray(p.eligibleFields) ? p.eligibleFields.map(String) : ensureArray(p.eligibleFields ?? p.fields),
              eligibleLevels: Array.isArray(p.eligibleLevels) ? p.eligibleLevels.map(String) : ensureArray(p.eligibleLevels ?? p.levels),
              isActive: typeof p.isActive === "boolean" ? p.isActive : true,
            })) as InsertScholarship[];
          }
        } catch {
          // parsing failed
        }
      }
    }
  } catch (err) {
    console.error("AI fetch error:", err);
  }

  return [];
}

/**
 * registerRoutes attaches all routes to the Express app and returns an http.Server
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // ------------------------
  // PROFILES
  // ------------------------
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const profile = await db.query.studentProfiles.findFirst({
        where: (p, { eq }) => eq(p.userId, req.params.userId),
      });
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get("/api/profile/id/:profileId", async (req, res) => {
    try {
      const profile = await db.query.studentProfiles.findFirst({
        where: (p, { eq }) => eq(p.id, req.params.profileId),
      });
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const profileData = insertStudentProfileSchema.parse(req.body.profile);
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ message: "User ID is required" });

      // find user by id
      let user = await db.query.users.findFirst({ where: eq(users.id, userId) });

      // If the user doesn't exist, create one with the provided id.
      // The InsertUser type in your shared schema may not include `id` (DB usually generates it).
      // We explicitly insert with `as any` so TypeScript won't block inserting an explicit id.
      if (!user) {
        const newUser = {
          id: userId,
          // use profile email as username if available, else fallback to generated string
          username: profileData.email ?? profileData.name ?? `user-${Date.now()}`,
          // temporary password placeholder — replace with your auth flow / hash in production
          password: "temp-password",
        };
        // cast to any to avoid mismatch with InsertUser TypeScript type
        const [created] = await db.insert(users).values(newUser as any).returning();
        user = created;
      }

      const [profile] = await db
        .insert(studentProfiles)
        .values({ userId, ...profileData })
        .returning();

      res.status(201).json(profile);
    } catch (err: any) {
      console.error("Error creating profile:", err);
      res.status(500).json({ message: "Failed to create profile", error: err?.message });
    }
  });

  app.put("/api/profile/:id", async (req, res) => {
    try {
      const profileData = insertStudentProfileSchema.partial().parse(req.body);
      const [profile] = await db
        .update(studentProfiles)
        .set(profileData)
        .where(eq(studentProfiles.id, req.params.id))
        .returning();

      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ------------------------
  // SCHOLARSHIPS
  // ------------------------
  app.get("/api/scholarships", async (_req, res) => {
    try {
      const all = await db.select().from(scholarships);
      res.json(all);
    } catch (err) {
      console.error("Error fetching scholarships:", err);
      res.status(500).json({ message: "Failed to fetch scholarships" });
    }
  });

  // A seed endpoint that uses your sample seed (safe for dev)
  app.post("/api/seed/scholarships", async (_req, res) => {
    try {
      const seed: InsertScholarship[] = [
        {
          title: "National Merit STEM Scholarship",
          organization: "Future Scientists Foundation",
          amount: "₹15,000",
          deadline: "2024-03-15",
          description: "Supporting outstanding STEM students.",
          requirements: "Minimum 3.7 GPA, strong r
