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

// ✅ Helper to ensure values are stored correctly
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

      // Correct user creation logic
      let user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user) {
          const newUserData: InsertUser = {
              id: userId,
              email: profileData.email,
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
          deadline: "2024-05-10",
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
        {
          title: "Future of Healthcare Grant",
          organization: "Global Health Alliance",
          amount: "₹20,000",
          deadline: "2024-08-30",
          description: "For students dedicated to health innovation.",
          requirements: "Minimum 3.5 GPA, essay on healthcare's future.",
          tags: ["Healthcare", "Science", "Merit-Based"],
          type: "field-specific",
          eligibilityGpa: "3.5",
          eligibleFields: ["Medicine", "Biology", "Public Health"],
          eligibleLevels: ["graduate"],
          isActive: true,
        },
        {
          title: "Environmental Activism Scholarship",
          organization: "Green Planet Foundation",
          amount: "₹7,000",
          deadline: "2024-09-01",
          description: "Rewarding students committed to environmental protection.",
          requirements: "History of environmental advocacy or volunteering.",
          tags: ["Environment", "Activism"],
          type: "merit-based",
          eligibilityGpa: "3.2",
          eligibleFields: ["Environmental Science", "Sustainability"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Engineering Excellence Fund",
          organization: "Innovators Guild",
          amount: "₹12,000",
          deadline: "2024-10-15",
          description: "For top students in any engineering discipline.",
          requirements: "Minimum 3.6 GPA, recommendation letter from a professor.",
          tags: ["Engineering", "Merit-Based"],
          type: "field-specific",
          eligibilityGpa: "3.6",
          eligibleFields: ["All Engineering"],
          eligibleLevels: ["undergraduate"],
          isActive: true,
        },
        {
          title: "Data Science Fellowship",
          organization: "Data Solutions Collective",
          amount: "₹25,000",
          deadline: "2024-11-20",
          description: "Supporting postgraduate students in data science research.",
          requirements: "Minimum 3.8 GPA, research proposal.",
          tags: ["Data Science", "Postgraduate", "Research"],
          type: "merit-based",
          eligibilityGpa: "3.8",
          eligibleFields: ["Data Science", "Statistics"],
          eligibleLevels: ["graduate"],
          isActive: true,
        },
        {
          title: "Linguistic & Cultural Studies Award",
          organization: "Global Communication Institute",
          amount: "₹4,000",
          deadline: "2024-12-05",
          description: "For students studying languages and cultural history.",
          requirements: "Essay on cultural exchange.",
          tags: ["Arts", "Humanities"],
          type: "field-specific",
          eligibilityGpa: "3.0",
          eligibleFields: ["Linguistics", "Cultural Studies"],
          eligibleLevels: ["undergraduate"],
          isActive: true,
        },
        {
          title: "Future Business Leaders Scholarship",
          organization: "Commerce Leaders Network",
          amount: "₹9,000",
          deadline: "2025-01-20",
          description: "For students pursuing business and management careers.",
          requirements: "Minimum 3.5 GPA, business case study submission.",
          tags: ["Business", "Leadership"],
          type: "merit-based",
          eligibilityGpa: "3.5",
          eligibleFields: ["Business Administration", "Finance"],
          eligibleLevels: ["undergraduate"],
          isActive: true,
        },
        {
          title: "Media & Journalism Grant",
          organization: "Press Freedom Fund",
          amount: "₹6,000",
          deadline: "2025-02-15",
          description: "Supporting aspiring journalists and media professionals.",
          requirements: "Journalism portfolio or essay on media ethics.",
          tags: ["Journalism", "Media"],
          type: "field-specific",
          eligibilityGpa: "2.8",
          eligibleFields: ["Journalism", "Communications"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Public Service Fellowship",
          organization: "Civic Engagement Alliance",
          amount: "₹18,000",
          deadline: "2025-03-25",
          description: "For students committed to working in the public sector.",
          requirements: "Letter of intent, minimum 3.0 GPA.",
          tags: ["Public Service", "Community"],
          type: "merit-based",
          eligibilityGpa: "3.0",
          eligibleFields: ["Political Science", "Public Administration"],
          eligibleLevels: ["graduate"],
          isActive: true,
        },
        {
          title: "Aerospace Engineering Scholarship",
          organization: "Space Explorers Foundation",
          amount: "₹22,000",
          deadline: "2025-04-10",
          description: "For students pursuing careers in aerospace.",
          requirements: "Minimum 3.9 GPA, passion for space exploration.",
          tags: ["STEM", "Aerospace", "Merit-Based"],
          type: "field-specific",
          eligibilityGpa: "3.9",
          eligibleFields: ["Aerospace Engineering"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Psychology Research Grant",
          organization: "Mind & Brain Institute",
          amount: "₹14,000",
          deadline: "2025-05-01",
          description: "Supporting psychology students in research projects.",
          requirements: "Research proposal, minimum 3.5 GPA.",
          tags: ["Psychology", "Research"],
          type: "merit-based",
          eligibilityGpa: "3.5",
          eligibleFields: ["Psychology"],
          eligibleLevels: ["graduate"],
          isActive: true,
        },
        {
          title: "Agricultural Science Award",
          organization: "Sustainable Farming Initiative",
          amount: "₹8,500",
          deadline: "2025-06-01",
          description: "For students advancing agricultural sustainability.",
          requirements: "Essay on sustainable farming practices.",
          tags: ["Agriculture", "Sustainability"],
          type: "field-specific",
          eligibilityGpa: "2.7",
          eligibleFields: ["Agricultural Science", "Agronomy"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Computer Vision & AI Grant",
          organization: "AI Innovations Hub",
          amount: "₹30,000",
          deadline: "2025-07-20",
          description: "High-value grant for AI and computer vision researchers.",
          requirements: "Advanced project proposal, recommendation from a professor.",
          tags: ["AI", "Computer Science", "Research"],
          type: "merit-based",
          eligibilityGpa: "4.0",
          eligibleFields: ["Computer Science", "AI", "Computer Vision"],
          eligibleLevels: ["graduate", "phd"],
          isActive: true,
        },
        {
          title: "Music Education Scholarship",
          organization: "Harmony Foundation",
          amount: "₹4,500",
          deadline: "2025-08-10",
          description: "For students pursuing music education.",
          requirements: "Proof of teaching or performance experience.",
          tags: ["Arts", "Education"],
          type: "field-specific",
          eligibilityGpa: "2.9",
          eligibleFields: ["Music Education"],
          eligibleLevels: ["undergraduate"],
          isActive: true,
        },
        {
          title: "UX/UI Design Scholarship",
          organization: "Digital Creators Collective",
          amount: "₹6,000",
          deadline: "2025-09-01",
          description: "For students with exceptional talent in UX/UI design.",
          requirements: "Portfolio showcasing user-centered design projects.",
          tags: ["Design", "Technology"],
          type: "merit-based",
          eligibilityGpa: "3.0",
          eligibleFields: ["UX/UI Design", "Human-Computer Interaction"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true,
        },
        {
          title: "Veterinary Science Scholarship",
          organization: "Animal Welfare Fund",
          amount: "₹10,000",
          deadline: "2025-10-15",
          description: "Supporting future veterinarians in their studies.",
          requirements: "Minimum 3.5 GPA, personal essay on animal care.",
          tags: ["Veterinary", "Science"],
          type: "field-specific",
          eligibilityGpa: "3.5",
          eligibleFields: ["Veterinary Science"],
          eligibleLevels: ["undergraduate", "graduate"],
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
      
      const allAiMatches: any[] = [];
      for (const profile of allProfiles) {
        const aiMatches = await generateScholarshipMatches(profile, allScholarships);
        for (const match of aiMatches) {
          const [savedMatch] = await db
            .insert(scholarshipMatches)
            .values({
              profileId: profile.id,
              scholarshipId: match.scholarshipId,
              matchScore: Number(match.matchScore) || 0,
              aiReasoning: match.aiReasoning,
            })
            .returning();
          
          allAiMatches.push({ ...savedMatch, scholarship: match });
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

      const enriched = matches.map((m) => ({
        ...m,
        scholarship: m.scholarshipId.startsWith("AI-Generated")
          ? {
              id: m.scholarshipId,
              title: m.scholarshipTitle,
              organization: m.scholarshipOrganization,
              amount: m.scholarshipAmount,
              deadline: m.scholarshipDeadline,
              requirements: m.scholarshipRequirements,
              tags: m.scholarshipTags,
              type: m.scholarshipType,
              eligibilityGpa: m.scholarshipEligibilityGpa,
              eligibleFields: m.scholarshipEligibleFields,
              eligibleLevels: m.scholarshipEligibleLevels,
              description: m.scholarshipDescription,
              isActive: true,
            }
          : allScholarships.find((s) => String(s.id) === String(m.scholarshipId)),
      }));

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
          scholarshipId: String(scholarshipId),
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
