import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      phone,
      specialization,
      licenseNumber,
      experienceYears,
      bio,
      consultationFee,
      availableDays,
      availableHoursStart,
      availableHoursEnd,
    } = body

    // Update user info
    await sql`
      UPDATE users 
      SET first_name = ${firstName}, last_name = ${lastName}, phone = ${phone}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Update doctor profile
    await sql`
      UPDATE doctor_profiles 
      SET 
        specialization = ${specialization},
        license_number = ${licenseNumber},
        experience_years = ${experienceYears || 0},
        bio = ${bio || null},
        consultation_fee = ${consultationFee || 0},
        available_days = ${availableDays || []},
        available_hours_start = ${availableHoursStart || "09:00"},
        available_hours_end = ${availableHoursEnd || "17:00"},
        updated_at = NOW()
      WHERE user_id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}
