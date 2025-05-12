import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Menekan peringatan Supabase tentang getSession
const originalConsoleWarn = console.warn
if (typeof console !== "undefined" && console.warn) {
  console.warn = function (message, ...args) {
    // Menekan peringatan spesifik dari Supabase
    if (
      typeof message === "string" &&
      message.includes("Using the user object as returned from supabase.auth.getSession()")
    ) {
      return
    }
    originalConsoleWarn.apply(this, [message, ...args])
  }
}

// Cache untuk menyimpan hasil auth checks
const authCheckCache = new Map<string, { isAuthenticated: boolean; timestamp: number; isAdmin?: boolean }>()
const AUTH_CACHE_TTL = 60000 // 1 menit

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // console.log("🔍 MIDDLEWARE: Processing request for path:", req.nextUrl.pathname)

  // Periksa apakah ini adalah rute yang memerlukan autentikasi
  const protectedRoutes = ["/dashboard", "/premium", "/admin"]
  const isProtectedRoute = protectedRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isProtectedRoute) {
    // Cek cache untuk path ini
    const cacheKey = req.nextUrl.pathname
    const cachedAuth = authCheckCache.get(cacheKey)

    if (cachedAuth && Date.now() - cachedAuth.timestamp < AUTH_CACHE_TTL) {
      // console.log("🔍 MIDDLEWARE: Using cached auth check for:", cacheKey)

      // Jika tidak terotentikasi, redirect ke login
      if (!cachedAuth.isAuthenticated) {
        // console.log("❌ MIDDLEWARE: No session (from cache), redirecting to login")
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/login"
        redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Jika ini adalah rute admin, periksa apakah pengguna adalah admin
      if (req.nextUrl.pathname.startsWith("/admin") && !cachedAuth.isAdmin) {
        // console.log("❌ MIDDLEWARE: User is not admin (from cache), redirecting to dashboard")
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }

      // console.log("✅ MIDDLEWARE: User authenticated (from cache), allowing access to:", req.nextUrl.pathname)
      return res
    }

    // console.log("🔍 MIDDLEWARE: Getting session")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    // console.log("🔍 MIDDLEWARE: Session exists?", !!session)

    // console.log("🔍 MIDDLEWARE: Checking auth for protected route:", req.nextUrl.pathname)

    // Jika tidak ada sesi dan ini adalah rute yang dilindungi, redirect ke login
    if (!session) {
      // Cache hasil auth check
      authCheckCache.set(cacheKey, {
        isAuthenticated: false,
        timestamp: Date.now(),
      })

      // console.log("❌ MIDDLEWARE: No session, redirecting to login")
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Jika ini adalah rute admin, periksa apakah pengguna adalah admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      // Dapatkan email pengguna dari sesi
      const email = session.user?.email

      // Daftar email admin
      const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda
      const isAdmin = email && adminEmails.includes(email)

      // Cache hasil auth check dengan status admin
      authCheckCache.set(cacheKey, {
        isAuthenticated: true,
        isAdmin,
        timestamp: Date.now(),
      })

      if (!isAdmin) {
        // console.log("❌ MIDDLEWARE: User is not admin, redirecting to dashboard")
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }
    } else {
      // Cache hasil auth check untuk non-admin routes
      authCheckCache.set(cacheKey, {
        isAuthenticated: true,
        timestamp: Date.now(),
      })
    }

    // console.log("✅ MIDDLEWARE: User authenticated, allowing access to:", req.nextUrl.pathname)
  }

  // console.log("✅ MIDDLEWARE: Request processing complete for:", req.nextUrl.pathname)
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/public (public API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/public).*)",
  ],
}
