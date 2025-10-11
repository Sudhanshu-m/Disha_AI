// server/services/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ✅ Use the correct model name — currently supported one
const MODEL_NAME = "gemini-1.5-flash-latest";

export async function generateGeminiResponse(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return response;
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    return "⚠️ Unable to generate AI response due to model or API issue.";
  }
}

export async function generateScholarshipMatches(
  userProfile: any,
  scholarships: any[]
) {
  try {
    const skills = userProfile.skills || [];
    const activities = userProfile.activities || [];
    const interests = userProfile.interests || [];

    const prompt = `
You are a scholarship recommender AI.
Match the following user with scholarships based on skills, activities, and interests.

User Profile:
Skills: ${skills.join(", ") || "None"}
Activities: ${activities.join(", ") || "None"}
Interests: ${interests.join(", ") || "None"}

Scholarships:
${scholarships
  .map((s, i) => `${i + 1}. ${s.name} - ${s.description}`)
  .join("\n")}

Return only JSON like:
[
  {"scholarshipId": "1", "matchScore": 85, "aiReasoning": "User has matching skills in coding"},
  {"scholarshipId": "2", "matchScore": 40, "aiReasoning": "Slight overlap with interest"}
]
`;

    const responseText = await generateGeminiResponse(prompt);

    try {
      const parsed = JSON.parse(responseText);
      return parsed;
    } catch {
      console.warn("⚠️ AI returned non-JSON. Using fallback matches.");
      return scholarships.map((s) => ({
        scholarshipId: s.id,
        matchScore: 50,
        aiReasoning: "No AI reasoning provided (fallback).",
      }));
    }
  } catch (error) {
    console.error("❌ Error in generateScholarshipMatches:", error);
    return scholarships.map((s) => ({
      scholarshipId: s.id,
      matchScore: 50,
      aiReasoning: "Error generating AI matches (fallback).",
    }));
  }
}
