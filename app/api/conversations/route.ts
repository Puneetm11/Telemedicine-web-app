import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await sql`
      SELECT 
        c.id,
        c.created_at,
        c.last_message_at as "updated_at",
        CASE 
          WHEN c.patient_id = ${user.id} THEN c.doctor_id
          ELSE c.patient_id
        END as other_user_id,
        CASE 
          WHEN c.patient_id = ${user.id} THEN CONCAT(du.first_name, ' ', du.last_name)
          ELSE CONCAT(pu.first_name, ' ', pu.last_name)
        END as other_user_name,
        CASE 
          WHEN c.patient_id = ${user.id} THEN 'doctor'
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
          AND sender_id != ${user.id}
          AND is_read = false
        )::int as unread_count
      FROM conversations c
      LEFT JOIN users pu ON c.patient_id = pu.id
      LEFT JOIN users du ON c.doctor_id = du.id
      LEFT JOIN doctor_profiles dp ON c.doctor_id = dp.user_id
      WHERE c.patient_id = ${user.id} OR c.doctor_id = ${user.id}
      ORDER BY c.last_message_at DESC
    `

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { doctorId, patientId } = await request.json()

    // The schema uses user IDs directly, not profile IDs
    let patientUserId: string
    let doctorUserId: string

    if (user.role === "patient") {
      patientUserId = user.id
      doctorUserId = doctorId
    } else {
      doctorUserId = user.id
      patientUserId = patientId
    }

    if (!patientUserId || !doctorUserId) {
      return NextResponse.json({ error: "Missing required user IDs" }, { status: 400 })
    }

    // Check if conversation exists
    const existing = await sql`
      SELECT id FROM conversations 
      WHERE patient_id = ${patientUserId} AND doctor_id = ${doctorUserId}
    `

    if (existing.length > 0) {
      return NextResponse.json(existing[0])
    }

    // Create new conversation
    const conversation = await sql`
      INSERT INTO conversations (patient_id, doctor_id)
      VALUES (${patientUserId}, ${doctorUserId})
      RETURNING id, created_at, updated_at
    `

    return NextResponse.json(conversation[0])
  } catch (error) {
    console.error("Create conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
