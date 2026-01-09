import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specialization = searchParams.get("specialization")
    const search = searchParams.get("search")

    let query = `
      SELECT 
        u.id, u.first_name as "firstName", u.last_name as "lastName", 
        u.avatar_url as "avatarUrl", u.email,
        dp.specialization, dp.experience_years as "experienceYears",
        dp.consultation_fee as "consultationFee", dp.bio, dp.rating,
        dp.total_reviews as "totalReviews", dp.is_verified as "isVerified",
        dp.available_days as "availableDays"
      FROM users u
      JOIN doctor_profiles dp ON u.id = dp.user_id
      WHERE u.role = 'doctor' AND u.is_active = true
    `

    const params: unknown[] = []
    let paramIndex = 1

    if (specialization) {
      query += ` AND dp.specialization ILIKE $${paramIndex}`
      params.push(`%${specialization}%`)
      paramIndex++
    }

    if (search) {
      query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR dp.specialization ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY dp.rating DESC, dp.total_reviews DESC`

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
