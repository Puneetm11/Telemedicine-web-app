import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    let prescriptions

    if (payload.role === "patient") {
      const patientProfile = await sql`
        SELECT id FROM patient_profiles WHERE user_id = ${payload.userId}
      `
      prescriptions = await sql`
        SELECT 
          p.id,
          p.medications,
          p.diagnosis,
          p.notes,
          p.valid_until,
          p.created_at,
          u.name as doctor_name,
          dp.specialization
        FROM prescriptions p
        JOIN doctor_profiles dp ON p.doctor_id = dp.id
        JOIN users u ON dp.user_id = u.id
        WHERE p.patient_id = ${patientProfile[0]?.id}
        ORDER BY p.created_at DESC
      `
    } else if (payload.role === "doctor") {
      const doctorProfile = await sql`
        SELECT id FROM doctor_profiles WHERE user_id = ${payload.userId}
      `

      if (patientId) {
        // Get prescriptions for specific patient
        prescriptions = await sql`
          SELECT 
            p.id,
            p.medications,
            p.diagnosis,
            p.notes,
            p.valid_until,
            p.created_at,
            pu.name as patient_name
          FROM prescriptions p
          JOIN patient_profiles pp ON p.patient_id = pp.id
          JOIN users pu ON pp.user_id = pu.id
          WHERE p.doctor_id = ${doctorProfile[0]?.id}
          AND p.patient_id = ${patientId}
          ORDER BY p.created_at DESC
        `
      } else {
        // Get all prescriptions by this doctor
        prescriptions = await sql`
          SELECT 
            p.id,
            p.medications,
            p.diagnosis,
            p.notes,
            p.valid_until,
            p.created_at,
            pu.name as patient_name
          FROM prescriptions p
          JOIN patient_profiles pp ON p.patient_id = pp.id
          JOIN users pu ON pp.user_id = pu.id
          WHERE p.doctor_id = ${doctorProfile[0]?.id}
          ORDER BY p.created_at DESC
        `
      }
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error("Get prescriptions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "doctor") {
      return NextResponse.json({ error: "Only doctors can create prescriptions" }, { status: 403 })
    }

    const { patientId, medications, diagnosis, notes, validUntil } = await request.json()

    const doctorProfile = await sql`
      SELECT id FROM doctor_profiles WHERE user_id = ${payload.userId}
    `

    const prescription = await sql`
      INSERT INTO prescriptions (patient_id, doctor_id, medications, diagnosis, notes, valid_until)
      VALUES (${patientId}, ${doctorProfile[0]?.id}, ${JSON.stringify(medications)}, ${diagnosis}, ${notes || null}, ${validUntil || null})
      RETURNING id, medications, diagnosis, notes, valid_until, created_at
    `

    // Create notification for patient
    const patientUser = await sql`
      SELECT user_id FROM patient_profiles WHERE id = ${patientId}
    `
    if (patientUser[0]) {
      await sql`
        INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
        VALUES (${patientUser[0].user_id}, 'prescription', 'New Prescription', ${`Dr. ${payload.name} has issued a new prescription for you`}, ${prescription[0].id}, 'prescription')
      `
    }

    return NextResponse.json(prescription[0])
  } catch (error) {
    console.error("Create prescription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
