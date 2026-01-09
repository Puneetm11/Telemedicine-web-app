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

    const notifications = await sql`
      SELECT 
        id,
        type,
        title,
        message,
        is_read,
        related_id,
        related_type,
        created_at
      FROM notifications
      WHERE user_id = ${payload.userId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    const unreadCount = await sql`
      SELECT COUNT(*)::int as count FROM notifications 
      WHERE user_id = ${payload.userId} AND is_read = false
    `

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
