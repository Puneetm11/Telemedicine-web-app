import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST() {
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

    await sql`
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = ${payload.userId} AND is_read = false
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark all read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
