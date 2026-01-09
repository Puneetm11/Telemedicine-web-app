import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, createToken, setSessionCookie } from "@/lib/auth"
import type { RegisterData } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json()
    const { email, password, firstName, lastName, role, phone } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `
    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 })
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const validRole = role === "doctor" || role === "admin" ? role : "patient"

    const [user] = await sql`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
      VALUES (${email}, ${passwordHash}, ${validRole}, ${firstName}, ${lastName}, ${phone || null})
      RETURNING id, email, role, first_name as "firstName", last_name as "lastName", phone
    `

    // Create role-specific profile
    if (validRole === "patient") {
      await sql`
        INSERT INTO patient_profiles (user_id) VALUES (${user.id})
      `
    } else if (validRole === "doctor") {
      await sql`
        INSERT INTO doctor_profiles (user_id, specialization, license_number)
        VALUES (${user.id}, 'General Practice', 'PENDING')
      `
    }

    // Create session token
    const token = await createToken(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      data: { user },
      message: "Registration successful",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 })
  }
}
