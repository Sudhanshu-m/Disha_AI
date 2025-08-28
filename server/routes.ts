import { Router, type Request, type Response } from "express";
import { db } from "../db"; // adjust path if needed
import { scholarships } from "../db/schema"; // adjust path if needed
import { eq } from "drizzle-orm";
import fetch from "node-fetch";

const router = Router();

// 🎓 Scholarship type
interface Scholarship {
  id?: number;
  name: string;
  description: string;
  eligibility: string;
  deadline: string;
  link: string;
}

// ✅ Health check
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// ✅ Get all scholarships
router.get("/scholarships", async (_req: Request, res: Response) => {
  try {
    const result: Scholarship[] = await db.select().from(scholarships);
    res.json(result);
  } catch (err) {
    console.error("[ERROR] fetching scholarships", err);
    res.status(500).json({ message: "Failed to fetch scholarships" });
  }
});

// ✅ Get scholarship by ID
router.get("/scholarships/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const result: Scholarship[] = await db
      .select()
      .from(scholarships)
      .where(eq(scholarships.id, id));

    if (result.length === 0) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    res.json(result[0]);
  } catch (err) {
    console.error("[ERROR] fetching scholarship by id", err);
    res.status(500).json({ message: "Failed to fetch scholarship" });
  }
});

// ✅ Add scholarship manually
router.post("/scholarships", async (req: Request, res: Response) => {
  try {
    const { name, description, eligibility, deadline, link } =
      req.body as Scholarship;

    if (!name || !description || !eligibility || !deadline || !link) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [inserted] = await db
      .insert(scholarships)
      .values({ name, description, eligibility, deadline, link })
      .returning();

    res.status(201).json(inserted);
  } catch (err) {
    console.error("[ERROR] adding scholarship", err);
    res.status(500).json({ message: "Failed to add scholarship" });
  }
});

// ✅ AI-powered scholarship fetch
router.get("/scholarships/ai", async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ message: "Missing Gemini/Google API key in env" });
    }

    const prompt = `
      List 5 current scholarships for Indian students in 2025.
      Return strictly in JSON array format:
      [
        { "name": "...", "description": "...", "eligibility": "...", "deadline": "...", "link": "..." }
      ]
    `;

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await aiResponse.json();
    let scholarshipsList: Scholarship[] = [];

    try {
      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      scholarshipsList = JSON.parse(rawText) as Scholarship[];
    } catch (err) {
      console.error("[ERROR] parsing AI response", err);
    }

    res.json(scholarshipsList);
  } catch (err) {
    console.error("[ERROR] fetching AI scholarships", err);
    res.status(500).json({ message: "Failed to fetch AI scholarships" });
  }
});

export default router;
