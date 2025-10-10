import OpenAI from "openai";
import type { StudentProfile, Scholarship } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface ScholarshipMatchResult {
  scholarshipId: string;
  matchScore: number;
  reasoning: string;
}

interface ApplicationGuidanceResult {
  essayTips: string;
  checklist: string[];
  improvementSuggestions: string;
}

export async function generateScholarshipMatches(
  profile: StudentProfile,
  scholarships: Scholarship[]
): Promise<ScholarshipMatchResult[]> {
  try {
    const prompt = `
    Analyze the following student profile and provide match scores (0-100) for each scholarship opportunity.
    Consider factors like academic requirements, field of study alignment, financial need, extracurricular activities, and eligibility criteria.

    Student Profile:
    - Education Level: ${profile.educationLevel}
    - Field of Study: ${profile.fieldOfStudy}
    - GPA: ${profile.gpa || "Not provided"}
    - Graduation Year: ${profile.graduationYear}
    - Skills: ${profile.skills || "Not provided"}
    - Activities: ${profile.activities || "Not provided"}
    - Financial Need: ${profile.financialNeed}
    - Location Preference: ${profile.location}

    Scholarships to evaluate:
    ${scholarships.map(s => `
    ID: ${s.id}
    Title: ${s.title}
    Type: ${s.type}
    Requirements: ${s.requirements}
    Eligible Fields: ${s.eligibleFields?.join(", ") || "Any"}
    Eligible Levels: ${s.eligibleLevels?.join(", ") || "Any"}
    Min GPA: ${s.eligibilityGpa || "Not specified"}
    Tags: ${s.tags.join(", ")}
    `).join("\n")}

    Provide your analysis in JSON format with an array of matches:
    {
      "matches": [
        {
          "scholarshipId": "scholarship_id",
          "matchScore": 85,
          "reasoning": "Detailed explanation of why this is a good match"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert scholarship counselor who helps students find the best funding opportunities. Provide accurate, helpful match scores and detailed reasoning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.matches || [];
  } catch (error) {
    console.error("Error generating scholarship matches:", error);
    return [];
  }
}

export async function generateApplicationGuidance(
  profile: StudentProfile,
  scholarship: Scholarship
): Promise<ApplicationGuidanceResult> {
  try {
    const prompt = `
    Generate personalized application guidance for this student and scholarship opportunity.
    
    Student Profile:
    - Name: ${profile.name}
    - Education Level: ${profile.educationLevel}
    - Field of Study: ${profile.fieldOfStudy}
    - GPA: ${profile.gpa || "Not provided"}
    - Skills: ${profile.skills || "Not provided"}
    - Activities: ${profile.activities || "Not provided"}
    - Financial Need: ${profile.financialNeed}

    Scholarship Details:
    - Title: ${scholarship.title}
    - Organization: ${scholarship.organization}
    - Type: ${scholarship.type}
    - Amount: ${scholarship.amount}
    - Requirements: ${scholarship.requirements}
    - Description: ${scholarship.description}

    Provide guidance in JSON format:
    {
      "essayTips": "Detailed essay writing tips specific to this scholarship",
      "checklist": ["Specific requirement 1", "Specific requirement 2", ...],
      "improvementSuggestions": "Suggestions for strengthening the student's profile for this opportunity"
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional scholarship advisor who provides detailed, actionable guidance to help students succeed in their applications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      essayTips: result.essayTips || "Focus on your unique experiences and how they align with the scholarship's mission.",
      checklist: result.checklist || ["Complete application form", "Submit transcripts", "Write personal statement"],
      improvementSuggestions: result.improvementSuggestions || "Continue developing your skills and gaining relevant experience."
    };
  } catch (error) {
    console.error("Error generating application guidance:", error);
    return {
      essayTips: "Focus on your unique experiences and how they align with the scholarship's mission.",
      checklist: ["Complete application form", "Submit transcripts", "Write personal statement"],
      improvementSuggestions: "Continue developing your skills and gaining relevant experience."
    };
  }
}
