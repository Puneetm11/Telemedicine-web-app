import { neon } from "@neondatabase/serverless"

// Create a reusable SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Helper function for common queries
export async function query<T>(queryString: string, params?: unknown[]): Promise<T[]> {
  try {
    const result = await sql.query(queryString, params)
    if (!result || !result.rows) {
      return []
    }
    return result.rows as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Helper for single result queries
export async function queryOne<T>(queryString: string, params?: unknown[]): Promise<T | null> {
  const results = await query<T>(queryString, params)
  return results && results.length > 0 ? results[0] : null
}
