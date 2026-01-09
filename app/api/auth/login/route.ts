import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword, createToken, setSessionCookie } from "@/lib/auth"
import type { LoginCredentials } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const [user] = await sql`
      SELECT id, email, password_hash, role, first_name as "firstName", 
             last_name as "lastName", phone, is_active as "isActive"
      FROM users WHERE email = ${email}
    `

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: "Account is deactivated" }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Create session token
    const token = await createToken(user.id)
    await setSessionCookie(token)

    // Remove password from response
    const { password_hash: _, ...safeUser } = user

    return NextResponse.json({
      success: true,
      data: { user: safeUser },
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
