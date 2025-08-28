import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

// --- helper: fetch from AI API (OpenAI or other) ---
async function fetchAIResponse(prompt: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set in environment");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data: any = await response.json(); // 👈 typed as any
  if (!data.choices || !data.choices[0]) {
    throw new Error("No AI response");
  }

  return data.choices[0].message.content;
}

// --- test route ---
router.get("/", (req, res) => {
  res.json({ message: "API is working ✅" });
});

// --- scholarships route ---
router.get("/api/scholarships", async (req, res) => {
  try {
    const { country = "India", deadline = "2025" } = req.query;

    const prompt = `Find at least 5 real scholarships available for students in ${country}, 
    with application deadlines in ${deadline}. 
    Return the results in JSON format with fields: name, provider, amount, deadline, and link.`;

    const aiResponse = await fetchAIResponse(prompt);

    let scholarships;
    try {
      scholarships = JSON.parse(aiResponse); // if AI gave JSON
    } catch {
      scholarships = { raw: aiResponse }; // fallback: return raw text
    }

    res.json({ scholarships });
  } catch (err: any) {
    console.error("Scholarship fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch scholarships" });
  }
});

export default router;
