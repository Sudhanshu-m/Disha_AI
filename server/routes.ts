import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateScholarshipMatches, generateApplicationGuidance } from "./services/gemini";

// ========== TEMPORARY IN-MEMORY DATA (NO DB) ==========
interface User {
  id: string;
  username: string;
  password: string;
}

interface StudentProfile {
  id: string;
  userId: string;
  email: string;
  name?: string;
  gpa?: string;
  field?: string;
}

interface Scholarship {
  id: string;
  title: string;
  organization: string;
  amount: string;
  description: string;
  tags: string[];
}

interface ScholarshipMatch {
  id: string;
  profileId: string;
  scholarshipId: string;
  matchScore: number;
  status: string;
}

const users: User[] = [];
const profiles: StudentProfile[] = [];
const scholarships: Scholarship[] = [];
const matches: ScholarshipMatch[] = [];

// Utility
function randomId() {
  return Math.random().toString(36).substring(2, 10);
}

function ensureArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  return [String(val)];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // =========================
  // AUTH (simple, mock)
  // =========================

  app.post("/api/register", (req, res) => {
    const { id, username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });
    if (users.find((u) => u.username === username))
      return res.status(400).json({ message: "User already exists" });

    const newUser: User = { id: id || randomId(), username, password };
    users.push(newUser);
    res.json({ message: "Account created successfully", user: newUser });
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ message: "Login successful", user });
  });

  // =========================
  // PROFILES
  // =========================

  app.get("/api/profile/:userId", (req, res) => {
    const profile = profiles.find(
      (p) => p.userId === req.params.userId || p.id === req.params.userId
    );
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.post("/api/profile", (req, res) => {
    try {
      const { userId, profile } = req.body;
      if (!userId) return res.status(400).json({ message: "User ID required" });

      const newProfile: StudentProfile = {
        id: randomId(),
        userId,
        email: profile.email,
        name: profile.name,
        gpa: profile.gpa,
        field: profile.field,
      };

      profiles.push(newProfile);
      res.status(201).json(newProfile);
    } catch (err) {
      console.error("Error creating profile:", err);
      res.status(500).json({ message: "Failed to create profile" });
    }
  });

  // =========================
  // SCHOLARSHIPS (always ensure mock data)
  // =========================

  function ensureScholarships() {
    if (scholarships.length === 0) {
      scholarships.push(
        {
          id: "1",
          title: "Women in Tech Scholarship",
          organization: "Tech Innovators Inc.",
          amount: "₹8,000",
          description: "Encouraging women to pursue tech careers.",
          tags: ["Women", "STEM", "Technology"],
        },
        {
          id: "2",
          title: "Global Leaders Scholarship",
          organization: "World Education Fund",
          amount: "₹10,000",
          description: "For students showing exceptional leadership.",
          tags: ["Leadership", "Merit"],
        },
        {
          id: "3",
          title: "Sustainability Scholars Award",
          organization: "EcoFuture Foundation",
          amount: "₹6,000",
          description: "Supporting green innovation and sustainability.",
          tags: ["Environment", "Innovation"],
        }
      );
    }
  }

  app.get("/api/scholarships", (_req, res) => {
    ensureScholarships();
    res.json(scholarships);
  });

  // =========================
  // MATCHES (AI or mock)
  // =========================

  app.post("/api/matches/generate", async (req, res) => {
    try {
      const { profileId } = req.body;
      const profile = profiles.find(
        (p) => p.id === profileId || p.userId === profileId
      );
      if (!profile)
        return res.status(404).json({ message: "Profile not found" });

      ensureScholarships();

      let generatedMatches: ScholarshipMatch[] = [];

      try {
        // Map StudentProfile to the expected structure for generateScholarshipMatches
        const mappedProfile = {
          userId: profile.userId,
          id: profile.id,
          name: profile.name || "",
          createdAt: new Date(),
          email: profile.email,
          educationLevel: "",
          fieldOfStudy: profile.field || "",
          gpa: profile.gpa ?? null,
          graduationYear: "",
          skills: null,
          activities: null,
          financialNeed: "",
          location: "",
          updatedAt: new Date(),
        };
        // Map scholarships to the expected structure for generateScholarshipMatches
        const mappedScholarships = scholarships.map((s) => ({
          id: s.id,
          title: s.title,
          organization: s.organization,
          amount: s.amount,
          deadline: "", // Placeholder, as not present in mock
          description: s.description,
          requirements: "", // Placeholder, as not present in mock
          tags: s.tags,
          type: "", // Placeholder, as not present in mock
          eligibilityGpa: null, // Placeholder, as not present in mock
          eligibleFields: null, // Placeholder, as not present in mock
          eligibleLevels: null, // Placeholder, as not present in mock
          isActive: true, // Placeholder, as not present in mock
          createdAt: new Date(), // Placeholder, as not present in mock
        }));

        // Try to generate AI-based matches using Gemini
        const aiMatches = await generateScholarshipMatches(mappedProfile, mappedScholarships);
        if (aiMatches && Array.isArray(aiMatches) && aiMatches.length > 0) {
          generatedMatches = aiMatches.map((m) => ({
            ...m,
            id: randomId(),
            profileId: profile.id,
            status: "pending",
          }));
        } else {
          throw new Error("AI match generation returned empty");
        }
      } catch (error) {
        console.warn("Gemini AI failed, using random matches:", error);
        // Fallback to random match generation
        generatedMatches = scholarships.map((s) => ({
          id: randomId(),
          profileId: profile.id,
          scholarshipId: s.id,
          matchScore: Math.floor(Math.random() * 100),
          status: "pending",
        }));
      }

      matches.push(...generatedMatches);
      res.json({ matches: generatedMatches });
    } catch (err) {
      console.error("Error generating matches:", err);
      res.status(500).json({ message: "Failed to generate matches" });
    }
  });

  app.get("/api/matches/:profileId", (req, res) => {
    const profileMatches = matches.filter(
      (m) => m.profileId === req.params.profileId
    );
    res.json(profileMatches);
  });

  // =========================
  // APPLICATION GUIDANCE (mock)
  // =========================

  app.post("/api/guidance", async (req, res) => {
    const { profileId, scholarshipId } = req.body;

    try {
      const profile = profiles.find(
        (p) => p.id === profileId || p.userId === profileId
      );
      const scholarship = scholarships.find((s) => s.id === scholarshipId);

      if (!profile)
        return res.status(404).json({ message: "Profile not found" });
      if (!scholarship)
        return res.status(404).json({ message: "Scholarship not found" });

      // Map StudentProfile to the expected structure for generateApplicationGuidance
      const mappedProfile = {
        userId: profile.userId,
        id: profile.id,
        name: profile.name || "",
        createdAt: new Date(),
        email: profile.email,
        educationLevel: "",
        fieldOfStudy: profile.field || "",
        gpa: profile.gpa ?? null,
        graduationYear: "",
        skills: null,
        activities: null,
        financialNeed: "",
        location: "",
        updatedAt: new Date(),
      };

      let guidance;
      try {
        // Map scholarship to expected structure
        const mappedScholarship = {
          id: scholarship.id,
          title: scholarship.title,
          organization: scholarship.organization,
          amount: scholarship.amount,
          deadline: "", // Placeholder, as not present in mock
          description: scholarship.description,
          requirements: "", // Placeholder, as not present in mock
          tags: scholarship.tags,
          type: "", // Placeholder, as not present in mock
          eligibilityGpa: null, // Placeholder, as not present in mock
          eligibleFields: null, // Placeholder, as not present in mock
          eligibleLevels: null, // Placeholder, as not present in mock
          isActive: true, // Placeholder, as not present in mock
          createdAt: new Date(), // Placeholder, as not present in mock
        };
        guidance = await generateApplicationGuidance(mappedProfile, mappedScholarship);
      } catch {
        guidance = {
          essayTips: ["Be concise", "Show your motivation"],
          checklist: ["Fill form", "Upload docs", "Submit essay"],
          improvementSuggestions: ["Highlight leadership", "Proofread grammar"],
        };
      }

      res.json({ profileId, scholarshipId, ...guidance });
    } catch (err) {
      console.error("Error generating guidance:", err);
      res.status(500).json({ message: "Failed to generate guidance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
