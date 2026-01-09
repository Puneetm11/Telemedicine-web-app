import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { del } from "@vercel/blob"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Get report and verify ownership
    const report = await sql`
      SELECT mr.*, pp.user_id as patient_user_id
      FROM medical_reports mr
      JOIN patient_profiles pp ON mr.patient_id = pp.id
      WHERE mr.id = ${id}
    `

    if (report.length === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (report[0].patient_user_id !== payload.userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Delete from Vercel Blob
    if (report[0].file_url) {
      try {
        await del(report[0].file_url)
      } catch (e) {
        console.error("Failed to delete blob:", e)
      }
    }

    // Delete from database
    await sql`DELETE FROM medical_reports WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
