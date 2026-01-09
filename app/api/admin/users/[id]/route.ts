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
    const { isActive } = body

    // Prevent admin from deactivating themselves
    if (id === user.id) {
      return NextResponse.json({ success: false, error: "Cannot modify your own account" }, { status: 400 })
    }

    const [updated] = await sql`
      UPDATE users 
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, first_name, last_name, is_active
    `

    if (!updated) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}
