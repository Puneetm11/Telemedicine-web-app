import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const [existing] = await sql`
      SELECT * FROM appointments WHERE id = ${id}
    `

    if (!existing) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
    }

    // Check permissions
    if (user.role === "patient" && existing.patient_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    if (user.role === "doctor" && existing.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    // Update appointment status to cancelled
    const [updated] = await sql`
      UPDATE appointments 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    // Send notification to the other party
    const notifyUserId = user.role === "patient" ? existing.doctor_id : existing.patient_id
    await sql`
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        ${notifyUserId},
        'Appointment Cancelled',
        'An appointment has been cancelled',
        'appointment',
        ${user.role === "patient" ? "/doctor/appointments" : "/patient/appointments"}
      )
    `

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Appointment cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return NextResponse.json({ success: false, error: "Failed to cancel appointment" }, { status: 500 })
  }
}

