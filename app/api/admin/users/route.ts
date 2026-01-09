import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const role = searchParams.get("role")

    let query = `
      SELECT 
        id, first_name as "firstName", last_name as "lastName", 
        email, phone, role, is_active as "isActive", 
        email_verified as "emailVerified", created_at as "createdAt",
        avatar_url as "avatarUrl"
      FROM users
      WHERE 1=1
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (role && role !== "all") {
      query += ` AND role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC`

    const users = await sql(query, params)

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}
