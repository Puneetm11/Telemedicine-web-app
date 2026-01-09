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

    let query = `
      SELECT 
        u.id, u.first_name as "firstName", u.last_name as "lastName", 
        u.email, u.avatar_url as "avatarUrl", u.is_active as "isActive",
        dp.specialization, dp.license_number as "licenseNumber",
        dp.experience_years as "experienceYears", dp.consultation_fee as "consultationFee",
        dp.rating, dp.total_reviews as "totalReviews", dp.is_verified as "isVerified"
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'doctor'
    `
    const params: unknown[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR dp.specialization ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY dp.is_verified ASC, u.created_at DESC`

    const doctors = await sql(query, params)

    return NextResponse.json({
      success: true,
      data: doctors,
    })
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch doctors" }, { status: 500 })
  }
}
