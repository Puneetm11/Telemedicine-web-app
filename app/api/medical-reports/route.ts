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

    let reports

    if (payload.role === "patient") {
      // Patient can only see their own reports
      const patientProfile = await sql`
        SELECT id FROM patient_profiles WHERE user_id = ${payload.userId}
      `
      reports = await sql`
        SELECT 
          mr.id,
          mr.title,
          mr.description,
          mr.file_url,
          mr.file_type,
          mr.uploaded_at,
          mr.shared_with_doctor_id,
          u.name as doctor_name,
          dp.specialization
        FROM medical_reports mr
        LEFT JOIN doctor_profiles dp ON mr.shared_with_doctor_id = dp.id
        LEFT JOIN users u ON dp.user_id = u.id
        WHERE mr.patient_id = ${patientProfile[0]?.id}
        ORDER BY mr.uploaded_at DESC
      `
    } else if (payload.role === "doctor" && patientId) {
      // Doctor can see reports shared with them
      const doctorProfile = await sql`
        SELECT id FROM doctor_profiles WHERE user_id = ${payload.userId}
      `
      reports = await sql`
        SELECT 
          mr.id,
          mr.title,
          mr.description,
          mr.file_url,
          mr.file_type,
          mr.uploaded_at,
          pu.name as patient_name
        FROM medical_reports mr
        JOIN patient_profiles pp ON mr.patient_id = pp.id
        JOIN users pu ON pp.user_id = pu.id
        WHERE mr.patient_id = ${patientId}
        AND mr.shared_with_doctor_id = ${doctorProfile[0]?.id}
        ORDER BY mr.uploaded_at DESC
      `
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Get reports error:", error)
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
    if (!payload || payload.role !== "patient") {
      return NextResponse.json({ error: "Only patients can upload reports" }, { status: 403 })
    }

    const { title, description, fileUrl, fileType, sharedWithDoctorId } = await request.json()

    const patientProfile = await sql`
      SELECT id FROM patient_profiles WHERE user_id = ${payload.userId}
    `

    const report = await sql`
      INSERT INTO medical_reports (patient_id, title, description, file_url, file_type, shared_with_doctor_id)
      VALUES (${patientProfile[0]?.id}, ${title}, ${description || null}, ${fileUrl}, ${fileType}, ${sharedWithDoctorId || null})
      RETURNING id, title, description, file_url, file_type, uploaded_at
    `

    // Create notification for doctor if shared
    if (sharedWithDoctorId) {
      const doctorUser = await sql`
        SELECT user_id FROM doctor_profiles WHERE id = ${sharedWithDoctorId}
      `
      if (doctorUser[0]) {
        await sql`
          INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
          VALUES (${doctorUser[0].user_id}, 'report', 'New Medical Report Shared', ${`${payload.name} shared a medical report: ${title}`}, ${report[0].id}, 'medical_report')
        `
      }
    }

    return NextResponse.json(report[0])
  } catch (error) {
    console.error("Create report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
