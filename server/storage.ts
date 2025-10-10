import {
  users,
  studentProfiles,
  scholarships,
  scholarshipMatches,
  applicationGuidance,
  type User,
  type InsertUser,
  type StudentProfile,
  type InsertStudentProfile,
  type Scholarship,
  type InsertScholarship,
  type ScholarshipMatch,
  type InsertScholarshipMatch,
  type ApplicationGuidance,
  type InsertApplicationGuidance
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, ilike, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student profile methods
  getStudentProfile(userId: string): Promise<StudentProfile | undefined>;
  getStudentProfileById(profileId: string): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile & { userId: string }): Promise<StudentProfile>;
  updateStudentProfile(id: string, profile: Partial<InsertStudentProfile>): Promise<StudentProfile>;

  // Scholarship methods
  getAllScholarships(): Promise<Scholarship[]>;
  getScholarshipById(id: string): Promise<Scholarship | undefined>;
  createScholarship(scholarship: InsertScholarship): Promise<Scholarship>;
  searchScholarships(filters: {
    type?: string;
    minAmount?: number;
    tags?: string[];
    fieldOfStudy?: string;
    educationLevel?: string;
  }): Promise<Scholarship[]>;

  // Scholarship match methods
  getScholarshipMatches(profileId: string): Promise<(ScholarshipMatch & { scholarship: Scholarship })[]>;
  createScholarshipMatch(match: InsertScholarshipMatch): Promise<ScholarshipMatch>;
  updateMatchStatus(matchId: string, status: string): Promise<ScholarshipMatch>;

  // Application guidance methods
  getApplicationGuidance(profileId: string, scholarshipId: string): Promise<ApplicationGuidance | undefined>;
  createApplicationGuidance(guidance: InsertApplicationGuidance): Promise<ApplicationGuidance>;

  // Sample data seeding
  seedSampleData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    return profile || undefined;
  }

  async getStudentProfileById(profileId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, profileId));
    return profile || undefined;
  }

  async createStudentProfile(profile: InsertStudentProfile & { userId: string }): Promise<StudentProfile> {
    const [newProfile] = await db
      .insert(studentProfiles)
      .values({
        ...profile,
        updatedAt: sql`now()`
      })
      .returning();
    return newProfile;
  }

  async updateStudentProfile(id: string, profile: Partial<InsertStudentProfile>): Promise<StudentProfile> {
    const [updatedProfile] = await db
      .update(studentProfiles)
      .set({
        ...profile,
        updatedAt: sql`now()`
      })
      .where(eq(studentProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  async getAllScholarships(): Promise<Scholarship[]> {
    return await db.select().from(scholarships)
      .where(eq(scholarships.isActive, true))
      .orderBy(desc(scholarships.createdAt));
  }

  async getScholarshipById(id: string): Promise<Scholarship | undefined> {
    const [scholarship] = await db.select().from(scholarships).where(eq(scholarships.id, id));
    return scholarship || undefined;
  }

  async createScholarship(scholarship: InsertScholarship): Promise<Scholarship> {
    const [newScholarship] = await db
      .insert(scholarships)
      .values(scholarship)
      .returning();
    return newScholarship;
  }

  async searchScholarships(filters: {
    type?: string;
    minAmount?: number;
    tags?: string[];
    fieldOfStudy?: string;
    educationLevel?: string;
  }): Promise<Scholarship[]> {
    const conditions = [eq(scholarships.isActive, true)];

    if (filters.type) {
      conditions.push(eq(scholarships.type, filters.type));
    }

    if (filters.tags && filters.tags.length > 0) {
      // This is a simplified version - in production you'd want more sophisticated tag matching
      conditions.push(sql`${scholarships.tags} && ${filters.tags}`);
    }

    if (filters.fieldOfStudy) {
      conditions.push(sql`${scholarships.eligibleFields} @> ${[filters.fieldOfStudy]} OR ${scholarships.eligibleFields} IS NULL`);
    }

    if (filters.educationLevel) {
      conditions.push(sql`${scholarships.eligibleLevels} @> ${[filters.educationLevel]} OR ${scholarships.eligibleLevels} IS NULL`);
    }

    return await db.select().from(scholarships)
      .where(and(...conditions))
      .orderBy(desc(scholarships.createdAt));
  }

  async getScholarshipMatches(profileId: string): Promise<(ScholarshipMatch & { scholarship: Scholarship })[]> {
    return await db
      .select({
        id: scholarshipMatches.id,
        profileId: scholarshipMatches.profileId,
        scholarshipId: scholarshipMatches.scholarshipId,
        matchScore: scholarshipMatches.matchScore,
        aiReasoning: scholarshipMatches.aiReasoning,
        status: scholarshipMatches.status,
        createdAt: scholarshipMatches.createdAt,
        scholarship: scholarships,
      })
      .from(scholarshipMatches)
      .innerJoin(scholarships, eq(scholarshipMatches.scholarshipId, scholarships.id))
      .where(eq(scholarshipMatches.profileId, profileId))
      .orderBy(desc(scholarshipMatches.matchScore));
  }

  async createScholarshipMatch(match: InsertScholarshipMatch): Promise<ScholarshipMatch> {
    const [newMatch] = await db
      .insert(scholarshipMatches)
      .values(match)
      .returning();
    return newMatch;
  }

  async updateMatchStatus(matchId: string, status: string): Promise<ScholarshipMatch> {
    const [updatedMatch] = await db
      .update(scholarshipMatches)
      .set({ status })
      .where(eq(scholarshipMatches.id, matchId))
      .returning();
    return updatedMatch;
  }

  async getApplicationGuidance(profileId: string, scholarshipId: string): Promise<ApplicationGuidance | undefined> {
    const [guidance] = await db
      .select()
      .from(applicationGuidance)
      .where(and(
        eq(applicationGuidance.profileId, profileId),
        eq(applicationGuidance.scholarshipId, scholarshipId)
      ));
    return guidance || undefined;
  }

  async createApplicationGuidance(guidance: InsertApplicationGuidance): Promise<ApplicationGuidance> {
    const [newGuidance] = await db
      .insert(applicationGuidance)
      .values(guidance)
      .returning();
    return newGuidance;
  }

  async seedSampleData(): Promise<void> {
    // Clear existing data
    await db.delete(scholarshipMatches);
    await db.delete(applicationGuidance);
    await db.delete(scholarships);

    // Comprehensive scholarship and internship data
    const sampleScholarships = [
      // Technology Scholarships
      {
        title: "Google Computer Science Scholarship",
        organization: "Google Inc.",
        amount: "$10,000",
        deadline: "2025-03-15",
        description: "Supporting underrepresented students in computer science and technology fields.",
        requirements: "3.5+ GPA, demonstrated leadership, passion for computer science",
        tags: ["technology", "computer-science", "diversity", "leadership"],
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: ["Computer Science", "Software Engineering", "Information Technology"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "Microsoft LEAP Engineering Scholarship",
        organization: "Microsoft Corporation",
        amount: "$25,000",
        deadline: "2025-04-01",
        description: "Full-time internship program for students from non-traditional backgrounds in tech.",
        requirements: "Enrolled in computer science or related field, strong coding skills",
        tags: ["technology", "internship", "coding", "diversity"],
        type: "merit-based",
        eligibilityGpa: "3.0",
        eligibleFields: ["Computer Science", "Software Engineering", "Electrical Engineering"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior"],
        isActive: true
      },
      {
        title: "Apple WWDC Student Scholarship",
        organization: "Apple Inc.",
        amount: "$5,000",
        deadline: "2025-05-20",
        description: "Supporting innovative student developers building apps for Apple platforms.",
        requirements: "App development portfolio, Swift programming skills",
        tags: ["technology", "mobile-development", "innovation", "apple"],
        type: "merit-based",
        eligibilityGpa: "3.0",
        eligibleFields: ["Computer Science", "Software Engineering", "Mobile Development"],
        eligibleLevels: ["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      
      // Engineering Scholarships
      {
        title: "Society of Women Engineers Scholarship",
        organization: "Society of Women Engineers",
        amount: "$15,000",
        deadline: "2025-02-15",
        description: "Empowering women in engineering and technology fields.",
        requirements: "Female student, 3.5+ GPA, engineering major",
        tags: ["engineering", "women", "stem", "leadership"],
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "IEEE Foundation Scholarship",
        organization: "Institute of Electrical and Electronics Engineers",
        amount: "$8,000",
        deadline: "2025-03-30",
        description: "Supporting students pursuing electrical engineering and computer science.",
        requirements: "IEEE student membership, strong academic performance",
        tags: ["engineering", "electrical", "ieee", "technology"],
        type: "merit-based",
        eligibilityGpa: "3.2",
        eligibleFields: ["Electrical Engineering", "Computer Engineering", "Computer Science"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },

      // Business & Finance Scholarships
      {
        title: "JP Morgan Chase Scholarship",
        organization: "JP Morgan Chase & Co.",
        amount: "₹16,50,000",
        deadline: "2025-04-15",
        description: "Supporting students pursuing careers in finance and business technology.",
        requirements: "Business or finance major, 3.3+ GPA, leadership experience",
        tags: ["finance", "business", "leadership", "banking"],
        type: "merit-based",
        eligibilityGpa: "3.3",
        eligibleFields: ["Business Administration", "Finance", "Economics", "Accounting"],
        eligibleLevels: ["undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "Goldman Sachs Scholarship Program",
        organization: "Goldman Sachs Group",
        amount: "₹24,75,000",
        deadline: "2025-03-01",
        description: "Comprehensive scholarship program for future finance leaders.",
        requirements: "Finance or economics major, exceptional academic record, internship experience",
        tags: ["finance", "investment", "leadership", "economics"],
        type: "merit-based",
        eligibilityGpa: "3.7",
        eligibleFields: ["Finance", "Economics", "Business Administration"],
        eligibleLevels: ["undergraduate-senior", "graduate-masters"],
        isActive: true
      },

      // Healthcare & Medical Scholarships
      {
        title: "American Medical Association Scholarship",
        organization: "American Medical Association",
        amount: "$35,000",
        deadline: "2025-05-01",
        description: "Supporting future healthcare professionals and medical researchers.",
        requirements: "Pre-med or medical student, 3.8+ GPA, healthcare volunteer experience",
        tags: ["medical", "healthcare", "research", "volunteer"],
        type: "merit-based",
        eligibilityGpa: "3.8",
        eligibleFields: ["Pre-Medicine", "Biology", "Chemistry", "Health Sciences"],
        eligibleLevels: ["undergraduate-junior", "undergraduate-senior", "graduate-masters"],
        isActive: true
      },
      {
        title: "Johnson & Johnson Nursing Scholarship",
        organization: "Johnson & Johnson",
        amount: "$12,000",
        deadline: "2025-06-15",
        description: "Supporting the next generation of nursing professionals.",
        requirements: "Nursing major, 3.5+ GPA, clinical experience",
        tags: ["nursing", "healthcare", "clinical", "patient-care"],
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: ["Nursing", "Health Sciences"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },

      // Environmental & Science Scholarships
      {
        title: "Environmental Protection Agency Scholarship",
        organization: "US Environmental Protection Agency",
        amount: "$18,000",
        deadline: "2025-04-30",
        description: "Supporting students committed to environmental protection and sustainability.",
        requirements: "Environmental science major, 3.4+ GPA, environmental project experience",
        tags: ["environmental", "sustainability", "science", "climate"],
        type: "merit-based",
        eligibilityGpa: "3.4",
        eligibleFields: ["Environmental Science", "Environmental Engineering", "Biology", "Chemistry"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "National Science Foundation STEM Scholarship",
        organization: "National Science Foundation",
        amount: "$22,000",
        deadline: "2025-02-28",
        description: "Advancing STEM education and research across all scientific disciplines.",
        requirements: "STEM major, 3.6+ GPA, research experience",
        tags: ["stem", "research", "science", "mathematics"],
        type: "merit-based",
        eligibilityGpa: "3.6",
        eligibleFields: ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science"],
        eligibleLevels: ["undergraduate-junior", "undergraduate-senior", "graduate-masters"],
        isActive: true
      },

      // Liberal Arts & Humanities
      {
        title: "Fulbright International Exchange Scholarship",
        organization: "US Department of State",
        amount: "$40,000",
        deadline: "2025-10-15",
        description: "International educational exchange program promoting cultural understanding.",
        requirements: "Bachelor's degree, strong academic record, language skills",
        tags: ["international", "cultural-exchange", "languages", "research"],
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: ["International Relations", "Languages", "Cultural Studies", "Political Science"],
        eligibleLevels: ["graduate-masters", "graduate-phd"],
        isActive: true
      },
      {
        title: "Humanities Research Council Grant",
        organization: "National Humanities Research Council",
        amount: "$15,000",
        deadline: "2025-03-20",
        description: "Supporting innovative research in humanities and social sciences.",
        requirements: "Humanities major, research proposal, faculty recommendation",
        tags: ["humanities", "research", "social-sciences", "culture"],
        type: "merit-based",
        eligibilityGpa: "3.4",
        eligibleFields: ["History", "Philosophy", "Literature", "Art History", "Anthropology"],
        eligibleLevels: ["undergraduate-senior", "graduate-masters"],
        isActive: true
      },

      // Need-based Scholarships
      {
        title: "First Generation College Student Scholarship",
        organization: "Educational Foundation",
        amount: "$8,000",
        deadline: "2025-07-01",
        description: "Supporting first-generation college students pursuing higher education.",
        requirements: "First-generation college student, demonstrated financial need",
        tags: ["first-generation", "financial-need", "education", "support"],
        type: "need-based",
        eligibilityGpa: "2.8",
        eligibleFields: null,
        eligibleLevels: ["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "Minority Student Success Fund",
        organization: "Diversity Education Alliance",
        amount: "$12,000",
        deadline: "2025-08-15",
        description: "Promoting educational equity for underrepresented minority students.",
        requirements: "Underrepresented minority status, financial need, 3.0+ GPA",
        tags: ["diversity", "minority", "equity", "financial-aid"],
        type: "need-based",
        eligibilityGpa: "3.0",
        eligibleFields: null,
        eligibleLevels: ["undergraduate-freshman", "undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },

      // Internship Opportunities
      {
        title: "NASA Summer Internship Program",
        organization: "National Aeronautics and Space Administration",
        amount: "$7,500",
        deadline: "2025-01-31",
        description: "Hands-on internship experience in aerospace engineering and space science.",
        requirements: "STEM major, 3.0+ GPA, US citizenship",
        tags: ["internship", "aerospace", "engineering", "space"],
        type: "internship",
        eligibilityGpa: "3.0",
        eligibleFields: ["Aerospace Engineering", "Mechanical Engineering", "Physics", "Computer Science"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "Meta Software Engineering Internship",
        organization: "Meta Platforms Inc.",
        amount: "$12,000",
        deadline: "2025-02-10",
        description: "Full-time summer internship building next-generation social technology.",
        requirements: "Computer science major, strong programming skills, previous internship experience",
        tags: ["internship", "software", "social-media", "technology"],
        type: "internship",
        eligibilityGpa: "3.2",
        eligibleFields: ["Computer Science", "Software Engineering"],
        eligibleLevels: ["undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "Tesla Engineering Co-op Program",
        organization: "Tesla Inc.",
        amount: "$15,000",
        deadline: "2025-03-05",
        description: "Six-month co-op program working on sustainable transportation and energy.",
        requirements: "Engineering major, 3.3+ GPA, passion for sustainability",
        tags: ["internship", "automotive", "sustainability", "engineering"],
        type: "internship",
        eligibilityGpa: "3.3",
        eligibleFields: ["Mechanical Engineering", "Electrical Engineering", "Chemical Engineering"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior", "undergraduate-senior"],
        isActive: true
      },
      {
        title: "Netflix Content Strategy Internship",
        organization: "Netflix Inc.",
        amount: "$8,000",
        deadline: "2025-04-20",
        description: "Summer internship in content analysis and entertainment industry strategy.",
        requirements: "Business, communications, or media studies major, analytical skills",
        tags: ["internship", "media", "entertainment", "strategy"],
        type: "internship",
        eligibilityGpa: "3.1",
        eligibleFields: ["Business Administration", "Communications", "Media Studies", "Marketing"],
        eligibleLevels: ["undergraduate-junior", "undergraduate-senior"],
        isActive: true
      }
    ];

    // Insert all scholarships
    for (const scholarship of sampleScholarships) {
      await db.insert(scholarships).values(scholarship);
    }

    console.log(`Seeded ${sampleScholarships.length} scholarships and internship opportunities`);
  }
}

export const storage = new DatabaseStorage();