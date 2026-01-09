import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "mediconnect-secret-key-change-in-production")

const publicPaths = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((path) => pathname === path || pathname.startsWith("/api/auth/"))) {
    return NextResponse.next()
  }

  // Check for session cookie
  const token = request.cookies.get("mediconnect-session")?.value

  if (!token) {
    // Redirect to login for protected pages
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Add user ID to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", payload.userId as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch {
    // Invalid token - redirect to login
    if (!pathname.startsWith("/api/")) {
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("mediconnect-session")
      return response
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
