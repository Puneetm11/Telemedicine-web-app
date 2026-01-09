import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const doctorProfile = await sql`
      SELECT id FROM doctor_profiles WHERE user_id = ${payload.userId}
    `

    // Get patients who have booked appointments with this doctor
    const patients = await sql`
      SELECT DISTINCT 
        pp.id,
        pp.user_id,
        u.name,
        u.email,
        pp.date_of_birth,
        pp.blood_type
      FROM patient_profiles pp
      JOIN users u ON pp.user_id = u.id
      JOIN appointments a ON a.patient_id = pp.id
      WHERE a.doctor_id = ${doctorProfile[0]?.id}
      ORDER BY u.name ASC
    `

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Get patients error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
