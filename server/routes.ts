import express from "express"
import crypto from "crypto"
import { db } from "../db"
import { profiles, scholarships, matches } from "../db/schema"
import { eq } from "drizzle-orm"
import { GoogleGenerativeAI } from "@google/generative-ai"

const router = express.Router()

// Gemini client setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY as string)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

// ------------------- PROFILE ROUTES -------------------

router.get("/profile/:userId", async (req, res) => {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, req.params.userId),
    })

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    res.json(profile)
  } catch (error) {
    console.error("Error fetching profile:", error)
    res.status(500).json({ message: "Error fetching profile" })
  }
})

router.post("/profile", async (req, res) => {
  try {
    const newProfile = {
      id: crypto.randomUUID(),
      ...req.body,
    }

    await db.insert(profiles).values(newProfile)

    res.status(201).json(newProfile)
  } catch (error) {
    console.error("Error creating profile:", error)
    res.status(500).json({ message: "Error creating profile" })
  }
})

// ------------------- MATCHING ROUTE -------------------

router.post("/matches/generate", async (req, res) => {
  try {
    const { profileId } = req.body

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
    })

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" })
    }

    // Check if scholarships already exist
    const existingScholarships = await db.select().from(scholarships)

    let scholarshipList = existingScholarships

    if (scholarshipList.length === 0) {
      console.log("⚡ No scholarships found in DB. Fetching from AI...")

      // Ask Gemini to suggest scholarships
      const prompt = `Suggest 5 real scholarships for a student with the following profile:
      Name: ${profile.name}
      Age: ${profile.age}
      Education: ${profile.education}
      Interests: ${profile.interests}
      Location: ${profile.location}
      Return as JSON array with fields: name, eligibility, deadline.`

      const result = await model.generateContent(prompt)
      const text = result.response.text()

      let aiScholarships: any[] = []
      try {
        aiScholarships = JSON.parse(text)
      } catch (err) {
        console.error("AI response parsing failed:", err, text)
        return res.status(500).json({ message: "AI did not return valid scholarships" })
      }

      // Save AI scholarships into DB
      const formatted = aiScholarships.map((s) => ({
        id: crypto.randomUUID(),
        name: s.name,
        eligibility: s.eligibility,
        deadline: s.deadline ? new Date(s.deadline) : null,
      }))

      await db.insert(scholarships).values(formatted)

      scholarshipList = formatted
    }

    // Naive matching: filter by education or interests
    const matchesForProfile = scholarshipList.filter((s) => {
      const eligibility = (s.eligibility || "").toLowerCase()
      return (
        eligibility.includes(profile.education?.toLowerCase() || "") ||
        eligibility.includes(profile.interests?.toLowerCase() || "")
      )
    })

    // Save matches
    const matchRecords = matchesForProfile.map((s) => ({
      id: crypto.randomUUID(),
      profileId: profile.id,
      scholarshipId: s.id,
    }))

    if (matchRecords.length > 0) {
      await db.insert(matches).values(matchRecords)
    }

    res.json(matchesForProfile)
  } catch (error) {
    console.error("Error generating matches:", error)
    res.status(500).json({ message: "Error generating matches" })
  }
})

export default router
