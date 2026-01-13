import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const specialization = searchParams.get("specialization")
    const search = searchParams.get("search")

    // Build query using template literals with conditional filters
    let doctors
    if (specialization && search) {
      const searchPattern = `%${search}%`
      const specPattern = `%${specialization}%`
      doctors = await sql`
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
          AND dp.specialization ILIKE ${specPattern}
          AND (u.first_name ILIKE ${searchPattern} OR u.last_name ILIKE ${searchPattern} OR dp.specialization ILIKE ${searchPattern})
        ORDER BY dp.rating DESC, dp.total_reviews DESC
      `
    } else if (specialization) {
      const specPattern = `%${specialization}%`
      doctors = await sql`
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
          AND dp.specialization ILIKE ${specPattern}
        ORDER BY dp.rating DESC, dp.total_reviews DESC
      `
    } else if (search) {
      const searchPattern = `%${search}%`
      doctors = await sql`
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
          AND (u.first_name ILIKE ${searchPattern} OR u.last_name ILIKE ${searchPattern} OR dp.specialization ILIKE ${searchPattern})
        ORDER BY dp.rating DESC, dp.total_reviews DESC
      `
    } else {
      doctors = await sql`
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
        ORDER BY dp.rating DESC, dp.total_reviews DESC
      `
    }

    return NextResponse.json({
      success: true,
      data: doctors,
    })
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch doctors" }, { status: 500 })
  }
}
