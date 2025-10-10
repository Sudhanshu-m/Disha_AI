// ==============================
// server/services/gemini.ts
// ==============================

import dotenv from "dotenv";
dotenv.config(); // Load .env immediately

import { GoogleGenAI } from "@google/genai";
import type { StudentProfile, Scholarship } from "@shared/schema";

/**
 * Lazy load GEMINI_API_KEY so we never access it before dotenv is loaded
 */
function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "❌ GEMINI_API_KEY is missing. Please add it to your .env file."
    );
  }
  return key;
}

/**
 * Initialize Gemini AI client
 */
function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: getGeminiApiKey(),
  });
}

/**
 * Generate a response from Gemini
 */
async function generateGeminiResponse(
  prompt: string,
  model = "gemini-1.5-flash-latest"
): Promise<string | null> {
  const aiClient = getAiClient();
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
export async function generateScholarshipMatches(
  profile: StudentProfile,
  scholarships: Scholarship[]
): Promise<any[]> {
  const scholarshipsText = scholarships
    .map(
      (s) => `
    - Scholarship ID: ${s.id}
    - Title: ${s.title}
    - Organization: ${s.organization}
    - Amount: ${s.amount}
    - Requirements: ${s.requirements}
    - Eligibility: GPA: ${s.eligibilityGpa}, Fields: ${s.eligibleFields}, Levels: ${s.eligibleLevels}
    - Description: ${s.description}
  `
    )
    .join("");

  const prompt = `You are a helpful and detailed scholarship matching AI. Your task is to analyze a student's profile and match them with the most suitable scholarships from a given list.

Student Profile:
${JSON.stringify(profile, null, 2)}

List of All Available Scholarships (total ${scholarships.length}):
${scholarshipsText}

Instructions:
1. Carefully compare the student's profile against the eligibility and requirements of every scholarship in the list.
2. For each scholarship, assign a matchScore from 0 to 100 based on how well the student fits the criteria. A score of 100 is a perfect match.
3. Provide a concise aiReasoning that explains why the student is a good fit for that scholarship, referencing specific details from both the profile and the scholarship requirements.
4. You must return a match object for ALL available scholarships in the list. Do not filter or exclude any scholarships. If a scholarship is not a good fit, give it a low matchScore.

Return the results as a valid JSON array of objects. Do not include any extra text or markdown.
`;

  const text = await generateGeminiResponse(prompt);
  let parsedMatches: any[] = [];

  try {
    if (text) {
      parsedMatches = JSON.parse(text);
      if (!Array.isArray(parsedMatches)) parsedMatches = [];
    }
  } catch (err) {
    console.error("❌ Failed to parse Gemini response JSON:", err, text);
    parsedMatches = [];
  }

  if (parsedMatches.length === 0 && scholarships.length > 0) {
    console.log(
      "⚠️ AI returned no matches. Providing fallback matches for all scholarships."
    );
    return scholarships.map((s) => ({
      scholarshipId: String(s.id),
      matchScore: 50,
      aiReasoning: `No AI reasoning provided. This is a default match for the scholarship titled: ${s.title}.`,
    }));
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
 * Generate AI-based guidance for a scholarship application
 */
export async function generateApplicationGuidance(
  profile: StudentProfile,
  scholarship: Scholarship
) {
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
