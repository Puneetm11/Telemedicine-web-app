import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { sql } from "./db"
import type { AuthUser } from "@/types"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "mediconnect-secret-key-change-in-production")

const COOKIE_NAME = "mediconnect-session"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string }
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getSessionCookie()
    if (!token) {
      console.log("[v0] No session cookie found")
      return null
    }

    const payload = await verifyToken(token)
    if (!payload) {
      console.log("[v0] Token verification failed")
      return null
    }

    console.log("[v0] Looking up user with ID:", payload.userId)

    // Use tagged template literal - returns array directly
    const users = await sql`
      SELECT 
        id, email, role, first_name as "firstName", last_name as "lastName",
        phone, avatar_url as "avatarUrl", is_active as "isActive",
        email_verified as "emailVerified", created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE id = ${payload.userId} AND is_active = true
    `

    console.log("[v0] User query result:", users)

    if (!users || users.length === 0) {
      console.log("[v0] No user found")
      return null
    }

    const user = users[0] as AuthUser

    // Fetch role-specific profile
    if (user.role === "patient") {
      const profiles = await sql`SELECT * FROM patient_profiles WHERE user_id = ${user.id}`
      if (profiles && profiles.length > 0) {
        user.patientProfile = profiles[0] as AuthUser["patientProfile"]
      }
    } else if (user.role === "doctor") {
      const profiles = await sql`
        SELECT 
          id, user_id as "userId", specialization, license_number as "licenseNumber",
          experience_years as "experienceYears", bio, consultation_fee as "consultationFee",
          available_days as "availableDays", available_hours_start as "availableHoursStart",
          available_hours_end as "availableHoursEnd", rating, total_reviews as "totalReviews",
          is_verified as "isVerified"
        FROM doctor_profiles WHERE user_id = ${user.id}
      `
      if (profiles && profiles.length > 0) {
        user.doctorProfile = profiles[0] as AuthUser["doctorProfile"]
      }
    }

    return user
  } catch (error) {
    console.error("[v0] getCurrentUser error:", error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireRole(roles: string[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden")
  }
  return user
}
