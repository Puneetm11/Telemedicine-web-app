import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Mark messages as read
    await sql`
      UPDATE messages 
      SET is_read = true 
      WHERE conversation_id = ${id} 
      AND sender_id != ${user.id}
      AND is_read = false
    `

    const messages = await sql`
      SELECT 
        m.id,
        m.content,
        m.is_read,
        m.created_at,
        m.sender_id,
        CONCAT(u.first_name, ' ', u.last_name) as sender_name,
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content } = await request.json()

    const message = await sql`
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (${id}, ${user.id}, ${content})
      RETURNING id, content, is_read, created_at, sender_id
    `

    // Update conversation timestamp
    await sql`
      UPDATE conversations SET last_message_at = NOW() WHERE id = ${id}
    `

    // Get recipient for notification - conversations use user IDs directly
    const [conversation] = await sql`
      SELECT 
        patient_id,
        doctor_id
      FROM conversations
      WHERE id = ${id}
    `

    const recipientId = conversation.patient_id === user.id ? conversation.doctor_id : conversation.patient_id

    // Create notification
    await sql`
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (${recipientId}, 'New Message', ${content.substring(0, 100)}, 'message', ${`/${user.role === 'patient' ? 'patient' : 'doctor'}/messages`})
    `

    return NextResponse.json({
      ...message[0],
      sender_name: `${user.firstName} ${user.lastName}`,
      sender_role: user.role,
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
