// ============================================
// DATABASE CLIENT
// ============================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create connection - only in server context
const connectionString = process.env.DATABASE_URL;

// Singleton pattern for database connection
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!connectionString) {
    console.warn("DATABASE_URL not set - using mock data");
    return null;
  }

  if (!db) {
    const client = postgres(connectionString, {
      prepare: false, // Required for Neon/Supabase
    });
    db = drizzle(client, { schema });
  }

  return db;
}

export type Database = ReturnType<typeof getDb>;
export { schema };



