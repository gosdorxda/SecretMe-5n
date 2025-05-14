import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cache to prevent excessive auth requests
const AUTH_CACHE_TTL = 60 * 1000 // 1 minute
const authCache = new Map<string, { data: any; timestamp: number }>()

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    // Skip auth check for static assets and public routes
    if (
      req.nextUrl.pathname.startsWith("/_next") ||
      req.nextUrl.pathname.startsWith("/public") ||
      req.nextUrl.pathname.startsWith("/api/public") ||
      req.nextUrl.pathname === "/favicon.ico"
    ) {
      return res
    }

    // Check if we need to protect this route
    const isProtectedRoute =
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/premium") ||
      req.nextUrl.pathname.startsWith("/admin")

    if (!isProtectedRoute) {
      return res
    }

    // Use a cache key based on cookies to prevent excessive auth requests
    const cookieString = req.headers.get("cookie") || ""
    const cacheKey = `auth_${cookieString}`
    const now = Date.now()
    const cachedAuth = authCache.get(cacheKey)

    // Use cached auth data if available and not expired
    if (cachedAuth && now - cachedAuth.timestamp < AUTH_CACHE_TTL) {
      const { session } = cachedAuth.data

      // For dashboard and premium routes, verify session
      if ((req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/premium")) && !session) {
        const redirectUrl = req.nextUrl.pathname + req.nextUrl.search
        return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(redirectUrl)}`, req.url))
      }

      // For admin routes, verify admin access
      if (req.nextUrl.pathname.startsWith("/admin")) {
        if (!session) {
          return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url))
        }

        if (!cachedAuth.data.isAdmin) {
          return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url))
        }
      }

      return res
    }

    const supabase = createMiddlewareClient({ req, res })

    // Get session with minimal requests
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let isAdmin = false

    // Only check admin status for admin routes
    if (session && req.nextUrl.pathname.startsWith("/admin")) {
      try {
        const { data: userData, error } = await supabase
          .from("users")
          .select("email")
          .eq("id", session.user.id)
          .single()

        if (!error) {
          const adminEmails = ["gosdorxda@gmail.com"]
          isAdmin = adminEmails.includes(userData?.email || "")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }

    // Cache the auth result
    authCache.set(cacheKey, {
      data: { session, isAdmin },
      timestamp: now,
    })

    // For dashboard and premium routes, verify session
    if ((req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/premium")) && !session) {
      const redirectUrl = req.nextUrl.pathname + req.nextUrl.search
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(redirectUrl)}`, req.url))
    }

    // For admin routes, verify admin access
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!session) {
        return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url))
      }

      if (!isAdmin) {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url))
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)

    // For error cases on protected routes, redirect to home
    if (
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/admin") ||
      req.nextUrl.pathname.startsWith("/premium")
    ) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones we explicitly exclude
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/public).*)",
  ],
}
