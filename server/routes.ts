import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import {
  studentProfiles,
  scholarships,
  scholarshipMatches,
  applicationGuidance,
  users,
  insertStudentProfileSchema,
  type InsertScholarship,
  type InsertUser
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  generateScholarshipMatches,
  generateApplicationGuidance,
} from "./services/gemini";

function ensureArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  return [String(val)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // =========================
  // PROFILES
  // =========================

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

      let user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user) {
          const newUserData: InsertUser = {
              id: userId,
              username: profileData.email,
              password: "temp-password"
          };
          [user] = await db.insert(users).values(newUserData).returning();
      }

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
          amount: "₹15,000",
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
        {
          title: "Arts & Creativity Grant",
          organization: "National Arts Council",
          amount: "₹5,000",
          deadline: "2024-04-01",
          description: "For students pursuing fine arts, design, or performing arts.",
          requirements: "Portfolio submission required.",
          tags: ["Arts", "Creativity", "Undergraduate"],
          type: "field-specific",
          eligibilityGpa: "2.5",
          eligibleFields: ["Fine Arts", "Performing Arts", "Design"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Global Leaders Need-Based Scholarship",
          organization: "World Education Fund",
          amount: "₹10,000",
          deadline: "2024-05-15",
          description: "Assisting students with financial need worldwide.",
          requirements: "Demonstrated financial need.",
          tags: ["Need-Based", "Leadership"],
          type: "need-based",
          eligibilityGpa: "2.8",
          eligibleFields: ["All"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Women in Tech Scholarship",
          organization: "Tech Innovators Inc.",
          amount: "₹8,000",
          deadline: "2024-06-20",
          description: "Encouraging women to pursue careers in technology.",
          requirements: "Female applicants only, tech-related major.",
          tags: ["Women", "STEM", "Technology"],
          type: "merit-based",
          eligibilityGpa: "3.0",
          eligibleFields: ["Computer Science", "Information Technology"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Community Service Leadership Award",
          organization: "Volunteer Heroes Foundation",
          amount: "₹3,500",
          deadline: "2024-07-15",
          description: "Rewarding exceptional community service contributions.",
          requirements: "Proof of volunteer or community leadership work.",
          tags: ["Community", "Leadership", "Service"],
          type: "merit-based",
          eligibilityGpa: "2.5",
          eligibleFields: ["All"],
          eligibleLevels: ["undergraduate"],
          isActive: true,
        },
      ];

      const existingScholarships = await db.select().from(scholarships);
      if (existingScholarships.length === 0) {
        for (const s of seed) {
          await db.insert(scholarships).values(s);
        }
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

  app.delete("/api/matches/all", async (_req, res) => {
    try {
        await db.delete(scholarshipMatches);
        res.status(200).json({ message: "All scholarship matches deleted successfully." });
    } catch (err) {
        console.error("Error deleting all matches:", err);
        res.status(500).json({ message: "Failed to delete all matches" });
    }
  });

  app.post("/api/matches/generate", async (req, res) => {
    try {
      const allProfiles = await db.select().from(studentProfiles);
      if (allProfiles.length === 0) {
        return res.status(404).json({ message: "No profiles found to generate matches for." });
      }

      const allScholarships = await db.select().from(scholarships);
      if (allScholarships.length === 0) {
        return res.status(404).json({ message: "No scholarships found to match against." });
      }
      
      const allAiMatches: any[] = [];
      for (const profile of allProfiles) {
        const aiMatches = await generateScholarshipMatches(profile, allScholarships);
        const validMatches = aiMatches.filter((m) =>
          allScholarships.some((s) => String(s.id) === String(m.scholarshipId))
        );
        for (const match of validMatches) {
          const [savedMatch] = await db
            .insert(scholarshipMatches)
            .values({
              profileId: profile.id,
              scholarshipId: String(match.scholarshipId),
              matchScore: Number(match.matchScore) || 0,
              aiReasoning: match.aiReasoning,
              status: "pending",
            })
            .returning();
          const scholarship = allScholarships.find(
            (s) => String(s.id) === String(match.scholarshipId)
          );
          allAiMatches.push({ ...savedMatch, scholarship });
        }
      }

      res.json({ matches: allAiMatches });
    } catch (err) {
      console.error("Error generating matches:", err);
      res.status(500).json({ message: "Failed to generate matches" });
    }
  });


  app.get("/api/matches/:profileId", async (req, res) => {
    try {
      const matches = await db
        .select()
        .from(scholarshipMatches)
        .where(eq(scholarshipMatches.profileId, req.params.profileId))
        .orderBy(desc(scholarshipMatches.matchScore));

      const allScholarships = await db.select().from(scholarships);

      const enriched = matches.map((m) => {
        const scholarship = allScholarships.find(
          (s) => String(s.id) === String(m.scholarshipId)
        );
        
        return {
          ...m,
          scholarship: scholarship
        }
      });

      res.json(enriched);
    } catch (err) {
      console.error("Error fetching matches:", err);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

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
          scholarshipId: String(guidance.scholarshipId),
          essayTips: ensureArray(guidance.essayTips),
          checklist: ensureArray(guidance.checklist),
          improvementSuggestions: ensureArray(guidance.improvementSuggestions),
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

  const httpServer = createServer(app);
  return httpServer;
}
