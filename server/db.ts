import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to set it in .env?");
}

// Create a pg pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle with schema + pg pool
export const db = drizzle(pool, { schema });
