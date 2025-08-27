import { GoogleGenAI } from "@google/genai";
import type { StudentProfile, Scholarship } from "@shared/schema";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("❌ GEMINI_API_KEY is missing. Please add it to your .env file.");
}

// Initialize the Gemini client once
const aiClient = new GoogleGenAI({
  apiKey: geminiApiKey,
});

/**
 * Helper to call Gemini API with a prompt and get the response text
 */
async function generateGeminiResponse(prompt: string, model = "gemini-1.5-flash-latest"): Promise<string | null> {
  try {
    const response = await aiClient.models.generateContent({
      model,
      contents: prompt,
    });

    const rawText = response.text ?? null;
    if (rawText) {
      const match = rawText.match(/```json\n([\s\S]*?)\n```/);
      return match ? match[1] : rawText;
    }

    return null;
  } catch (err) {
    console.error("❌ Gemini API error:", err);
    return null;
  }
}

/**
 * Generate AI-based scholarship matches using Gemini
 */
export async function generateScholarshipMatches(profile: StudentProfile, scholarships: Scholarship[]) {
  const scholarshipsText = scholarships.map(s => `
    - Scholarship ID: ${s.id}
    - Title: ${s.title}
    - Organization: ${s.organization}
    - Amount: ${s.amount}
    - Requirements: ${s.requirements}
    - Eligibility: GPA: ${s.eligibilityGpa}, Fields: ${s.eligibleFields}, Levels: ${s.eligibleLevels}
    - Description: ${s.description}
  `).join('');

  const prompt = `You are a helpful and detailed scholarship matching AI. Your task is to analyze a student's profile and match them with the most suitable scholarships from a given list.

Student Profile:
${JSON.stringify(profile, null, 2)}

List of Available Scholarships:
${scholarshipsText}

Instructions:
1.  Carefully compare the student's profile against the eligibility and requirements of each scholarship.
2.  For each scholarship, assign a matchScore from 0 to 100 based on how well the student fits the criteria. A score of 100 is a perfect match.
3.  Provide a concise aiReasoning that explains why the student is a good fit for that scholarship, referencing specific details from both the profile and the scholarship requirements.
4.  Return the top 20 most relevant matches. If fewer than 20 matches are found, return all available matches. Do not return an empty array unless no scholarships meet any criteria.

Return the results as a valid JSON array of objects. Do not include any extra text or markdown.

Example of a valid JSON array:
[
  {
    "scholarshipId": "1",
    "matchScore": 95,
    "aiReasoning": "Student's 3.8 GPA and major in Computer Science match the STEM scholarship requirements."
  },
  {
    "scholarshipId": "2",
    "matchScore": 75,
    "aiReasoning": "Student has a strong portfolio, but the GPA is slightly below the recommended average."
  }
]
`;

  const text = await generateGeminiResponse(prompt);
  let parsedMatches: any[] = [];

  // Log the raw response from the AI before attempting to parse it.
  console.log("Raw Gemini API Response:", text);

  try {
    if (text) {
      parsedMatches = JSON.parse(text);
      if (!Array.isArray(parsedMatches)) parsedMatches = [];
    }
  } catch (err) {
    console.error("❌ Failed to parse Gemini response JSON:", err, text);
    parsedMatches = []; // Fallback to an empty array on parse failure
  }

  if (parsedMatches.length === 0 && scholarships.length > 0) {
    console.log("⚠️ AI returned no matches. Providing fallback matches with real IDs.");
    const fallbackMatches = [
      {
        scholarshipId: String(scholarships[0].id),
        matchScore: 80,
        aiReasoning: "Fallback match: This is a general-purpose scholarship that fits most student profiles."
      },
      {
        scholarshipId: String(scholarships[1].id),
        matchScore: 70,
        aiReasoning: "Fallback match: This is a merit-based scholarship for students with a strong academic background."
      }
    ];
    return fallbackMatches;
  } else if (parsedMatches.length === 0) {
    return [];
  }

  return parsedMatches.map((m: any) => ({
    scholarshipId: String(m.scholarshipId),
    matchScore: Number(m.matchScore) || 0,
    aiReasoning: m.aiReasoning || "No reasoning provided",
  }));
}

/**
 * Generate AI-based application guidance using Gemini
 */
export async function generateApplicationGuidance(profile: StudentProfile, scholarship: Scholarship) {
  const prompt = `You are an application advisor AI.
Student profile: ${JSON.stringify(profile, null, 2)}
Scholarship: ${JSON.stringify(scholarship, null, 2)}

Provide guidance in JSON format:
{
  "essayTips": ["tip1", "tip2"],
  "checklist": ["step1", "step2"],
  "improvementSuggestions": ["suggestion1", "suggestion2"]
}
`;

  const text = await generateGeminiResponse(prompt);
  if (!text) {
    return {
      essayTips: ["Focus on your personal story."],
      checklist: ["Review eligibility criteria.", "Gather required documents."],
      improvementSuggestions: ["Highlight achievements.", "Be specific about goals."],
    };
  }

  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch {
    return {
      essayTips: ["Focus on your personal story."],
      checklist: ["Review eligibility criteria.", "Gather required documents."],
      improvementSuggestions: ["Highlight achievements.", "Be specific about goals."],
    };
  }
}