import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "patient") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone,
      address,
      insuranceProvider,
      insuranceNumber,
    } = body

    // Update user info
    await sql`
      UPDATE users 
      SET first_name = ${firstName}, last_name = ${lastName}, phone = ${phone}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Update patient profile
    await sql`
      UPDATE patient_profiles 
      SET 
        date_of_birth = ${dateOfBirth || null},
        gender = ${gender || null},
        blood_type = ${bloodType || null},
        allergies = ${allergies || []},
        chronic_conditions = ${chronicConditions || []},
        emergency_contact_name = ${emergencyContactName || null},
        emergency_contact_phone = ${emergencyContactPhone || null},
        address = ${address || null},
        insurance_provider = ${insuranceProvider || null},
        insurance_number = ${insuranceNumber || null},
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
