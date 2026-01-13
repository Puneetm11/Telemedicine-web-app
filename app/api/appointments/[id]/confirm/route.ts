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

    // Check permissions - only doctors can confirm
    if (user.role !== "doctor") {
      return NextResponse.json({ success: false, error: "Only doctors can confirm appointments" }, { status: 403 })
    }

    if (existing.doctor_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    // Update appointment status to confirmed
    const [updated] = await sql`
      UPDATE appointments 
      SET 
        status = 'confirmed',
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    // Send notification to patient
    await sql`
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        ${existing.patient_id},
        'Appointment Confirmed',
        'Your appointment has been confirmed',
        'appointment',
        '/patient/appointments'
      )
    `

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Appointment confirmed successfully",
    })
  } catch (error) {
    console.error("Error confirming appointment:", error)
    return NextResponse.json({ success: false, error: "Failed to confirm appointment" }, { status: 500 })
  }
}

