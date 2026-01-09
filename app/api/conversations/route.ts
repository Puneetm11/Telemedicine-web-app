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
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const conversations = await sql`
      SELECT 
        c.id,
        c.created_at,
        c.updated_at,
        CASE 
          WHEN c.patient_id = ${payload.userId} THEN d.user_id
          ELSE p.user_id
        END as other_user_id,
        CASE 
          WHEN c.patient_id = ${payload.userId} THEN du.name
          ELSE pu.name
        END as other_user_name,
        CASE 
          WHEN c.patient_id = ${payload.userId} THEN 'doctor'
          ELSE 'patient'
        END as other_user_role,
        dp.specialization,
        (
          SELECT content FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message,
        (
          SELECT created_at FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message_at,
        (
          SELECT COUNT(*) FROM messages 
          WHERE conversation_id = c.id 
          AND sender_id != ${payload.userId}
          AND is_read = false
        )::int as unread_count
      FROM conversations c
      LEFT JOIN patient_profiles p ON c.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctor_profiles d ON c.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN doctor_profiles dp ON c.doctor_id = dp.id
      WHERE p.user_id = ${payload.userId} OR d.user_id = ${payload.userId}
      ORDER BY c.updated_at DESC
    `

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Get conversations error:", error)
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
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { doctorId, patientId } = await request.json()

    // Get profile IDs
    let patientProfileId: number
    let doctorProfileId: number

    if (payload.role === "patient") {
      const patientProfile = await sql`
        SELECT id FROM patient_profiles WHERE user_id = ${payload.userId}
      `
      patientProfileId = patientProfile[0]?.id
      doctorProfileId = doctorId
    } else {
      const doctorProfile = await sql`
        SELECT id FROM doctor_profiles WHERE user_id = ${payload.userId}
      `
      doctorProfileId = doctorProfile[0]?.id
      patientProfileId = patientId
    }

    // Check if conversation exists
    const existing = await sql`
      SELECT id FROM conversations 
      WHERE patient_id = ${patientProfileId} AND doctor_id = ${doctorProfileId}
    `

    if (existing.length > 0) {
      return NextResponse.json(existing[0])
    }

    // Create new conversation
    const conversation = await sql`
      INSERT INTO conversations (patient_id, doctor_id)
      VALUES (${patientProfileId}, ${doctorProfileId})
      RETURNING id, created_at, updated_at
    `

    return NextResponse.json(conversation[0])
  } catch (error) {
    console.error("Create conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
