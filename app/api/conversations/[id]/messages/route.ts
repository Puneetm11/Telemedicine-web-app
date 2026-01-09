import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    // Mark messages as read
    await sql`
      UPDATE messages 
      SET is_read = true 
      WHERE conversation_id = ${id} 
      AND sender_id != ${payload.userId}
      AND is_read = false
    `

    const messages = await sql`
      SELECT 
        m.id,
        m.content,
        m.is_read,
        m.created_at,
        m.sender_id,
        u.name as sender_name,
        u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ${id}
      ORDER BY m.created_at ASC
    `

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const { content } = await request.json()

    const message = await sql`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (${id}, ${payload.userId}, ${content})
      RETURNING id, content, is_read, created_at, sender_id
    `

    // Update conversation timestamp
    await sql`
      UPDATE conversations SET updated_at = NOW() WHERE id = ${id}
    `

    // Get recipient for notification
    const conversation = await sql`
      SELECT 
        p.user_id as patient_user_id,
        d.user_id as doctor_user_id
      FROM conversations c
      JOIN patient_profiles p ON c.patient_id = p.id
      JOIN doctor_profiles d ON c.doctor_id = d.id
      WHERE c.id = ${id}
    `

    const recipientId =
      conversation[0].patient_user_id === payload.userId
        ? conversation[0].doctor_user_id
        : conversation[0].patient_user_id

    // Create notification
    await sql`
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
      VALUES (${recipientId}, 'message', 'New Message', ${content.substring(0, 100)}, ${id}, 'conversation')
    `

    return NextResponse.json({
      ...message[0],
      sender_name: payload.name,
      sender_role: payload.role,
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
