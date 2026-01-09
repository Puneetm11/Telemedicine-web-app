import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isVerified } = body

    const [updated] = await sql`
      UPDATE doctor_profiles 
      SET is_verified = ${isVerified}, updated_at = NOW()
      WHERE user_id = ${id}
      RETURNING *
    `

    if (!updated) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 })
    }

    // Notify doctor
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        ${id},
        ${isVerified ? "Account Verified" : "Verification Revoked"},
        ${isVerified ? "Your doctor account has been verified. You can now receive appointments." : "Your verification has been revoked. Please contact support."},
        'account'
      )
    `

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Doctor ${isVerified ? "verified" : "unverified"} successfully`,
    })
  } catch (error) {
    console.error("Error updating doctor:", error)
    return NextResponse.json({ success: false, error: "Failed to update doctor" }, { status: 500 })
  }
}
