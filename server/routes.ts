import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import {
  studentProfiles,
  scholarships,
  scholarshipMatches,
  applicationGuidance,
  insertStudentProfileSchema,
  type InsertScholarship,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateScholarshipMatches,
  generateApplicationGuidance,
} from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // =========================
  // PROFILES
  // =========================

  // Get profile by userId
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

  // Get profile by profileId
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

  // Create new profile
  app.post("/api/profile", async (req, res) => {
    try {
      const profileData = insertStudentProfileSchema.parse(req.body.profile);
      const userId = req.body.userId;
      if (!userId) return res.status(400).json({ message: "User ID is required" });

      const [profile] = await db
        .insert(studentProfiles)
        .values({ userId, ...profileData })
        .returning();

      res.status(201).json(profile);
    } catch (err: any) {
      console.error("Error creating profile:", err);
      res
        .status(500)
        .json({ message: "Failed to create profile", error: err.message });
    }
  });

  // Update profile
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

  // =========================
  // SCHOLARSHIPS
  // =========================

  app.get("/api/scholarships", async (_req, res) => {
    try {
      const all = await db.select().from(scholarships);
      res.json(all);
    } catch (err) {
      console.error("Error fetching scholarships:", err);
      res.status(500).json({ message: "Failed to fetch scholarships" });
    }
  });

  app.post("/api/seed/scholarships", async (_req, res) => {
    try {
      const seed: InsertScholarship[] = [
        {
          title: "National Merit STEM Scholarship",
          organization: "Future Scientists Foundation",
          amount: "$15,000",
          deadline: "2024-03-15",
          description: "Supporting outstanding STEM students.",
          requirements: "Minimum 3.7 GPA, strong research interest.",
          tags: ["STEM", "Merit-Based", "Undergraduate"],
          type: "merit-based",
          eligibilityGpa: "3.7",
          eligibleFields: ["Computer Science", "Engineering"],
          eligibleLevels: ["undergraduate"],
          isActive: true,
        },
      ];

      for (const s of seed) {
        await db.insert(scholarships).values(s);
      }

      res.json({ message: "Scholarships seeded successfully", count: seed.length });
    } catch (err) {
      console.error("Error seeding scholarships:", err);
      res.status(500).json({ message: "Failed to seed scholarships" });
    }
  });

  // =========================
  // MATCHES
  // =========================

  // Generate matches for a profile
  app.post("/api/matches/generate", async (req, res) => {
    try {
      const { profileId } = req.body;
      if (!profileId)
        return res.status(400).json({ message: "Profile ID is required" });

      const profile = await db.query.studentProfiles.findFirst({
        where: (p, { eq }) => eq(p.id, profileId),
      });
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const allScholarships = await db.select().from(scholarships);

      // Call Gemini AI to generate matches
      const aiMatches = await generateScholarshipMatches(profile, allScholarships);

      const savedMatches: any[] = [];

      for (const match of aiMatches) {
        const [savedMatch] = await db
          .insert(scholarshipMatches)
          .values({
            profileId,
            scholarshipId: match.scholarshipId,
            matchScore: match.matchScore,
            aiReasoning: match.aiReasoning, // ✅ Gemini returns this
            status: "pending",
          })
          .returning();

        const scholarship = allScholarships.find(
          (s) => String(s.id) === String(match.scholarshipId)
        );

        savedMatches.push({ ...savedMatch, scholarship });
      }

      res.json({ matches: savedMatches });
    } catch (err) {
      console.error("Error generating matches:", err);
      res.status(500).json({ message: "Failed to generate matches" });
    }
  });

  // Fetch matches for a profile (with scholarship info)
  app.get("/api/matches/:profileId", async (req, res) => {
    try {
      const matches = await db
        .select()
        .from(scholarshipMatches)
        .where(eq(scholarshipMatches.profileId, req.params.profileId))
        .orderBy(desc(scholarshipMatches.matchScore));

      const allScholarships = await db.select().from(scholarships);

      const enriched = matches.map((m) => ({
        ...m,
        scholarship: allScholarships.find(
          (s) => String(s.id) === String(m.scholarshipId)
        ),
      }));

      res.json(enriched);
    } catch (err) {
      console.error("Error fetching matches:", err);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Update match status
  app.put("/api/matches/:matchId/status", async (req, res) => {
    try {
      const { status } = req.body;
      const [updated] = await db
        .update(scholarshipMatches)
        .set({ status })
        .where(eq(scholarshipMatches.id, req.params.matchId))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("Error updating match status:", err);
      res.status(500).json({ message: "Failed to update match status" });
    }
  });

  // =========================
  // APPLICATION GUIDANCE
  // =========================

  app.post("/api/guidance", async (req, res) => {
    try {
      const { profileId, scholarshipId } = req.body;
      if (!profileId || !scholarshipId) {
        return res
          .status(400)
          .json({ message: "Profile ID and Scholarship ID are required" });
      }

      const existing = await db
        .select()
        .from(applicationGuidance)
        .where(
          and(
            eq(applicationGuidance.profileId, profileId),
            eq(applicationGuidance.scholarshipId, scholarshipId)
          )
        );
      if (existing.length > 0) return res.json(existing[0]);

      const profile = await db.query.studentProfiles.findFirst({
        where: (p, { eq }) => eq(p.id, profileId),
      });
      const scholarship = await db.query.scholarships.findFirst({
        where: (s, { eq }) => eq(s.id, scholarshipId),
      });
      if (!profile || !scholarship) {
        return res
          .status(404)
          .json({ message: "Profile or scholarship not found" });
      }

      const guidance = await generateApplicationGuidance(profile, scholarship);
      const [saved] = await db
        .insert(applicationGuidance)
        .values({
          profileId: String(profileId),
          scholarshipId: String(scholarshipId),
          essayTips: guidance.essayTips,
          checklist: guidance.checklist,
          improvementSuggestions: guidance.improvementSuggestions,
        })
        .returning();

      res.json(saved);
    } catch (err) {
      console.error("Error generating guidance:", err);
      res.status(500).json({ message: "Failed to generate guidance" });
    }
  });

  app.get("/api/guidance/:profileId/:scholarshipId", async (req, res) => {
    try {
      const guidance = await db
        .select()
        .from(applicationGuidance)
        .where(
          and(
            eq(applicationGuidance.profileId, req.params.profileId),
            eq(applicationGuidance.scholarshipId, req.params.scholarshipId)
          )
        );

      if (!guidance || guidance.length === 0) {
        return res.status(404).json({ message: "Guidance not found" });
      }

      res.json(guidance[0]);
    } catch (err) {
      console.error("Error fetching guidance:", err);
      res.status(500).json({ message: "Failed to fetch guidance" });
    }
  });

  // =========================
  // SERVER
  // =========================

  const httpServer = createServer(app);
  return httpServer;
}
