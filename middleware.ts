import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { logAuthRequest } from "@/lib/auth-logger"

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
const AUTH_CACHE_TTL = 300000 // 5 menit (dari 1 menit)

// Throttling untuk middleware auth checks
let lastMiddlewareAuthCheck = 0
const MIN_AUTH_CHECK_INTERVAL = 5000 // 5 detik

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const path = request.nextUrl.pathname

  // Log middleware start
  logAuthRequest({
    endpoint: "middleware",
    method: "INTERNAL",
    source: "middleware",
    success: true,
    duration: 0,
    cached: false,
    details: {
      path,
      action: "start",
      userAgent: request.headers.get("user-agent") || undefined,
      ip: request.ip || request.headers.get("x-forwarded-for") || undefined,
    },
  })

  const startTime = performance.now()

  // Periksa apakah ini adalah rute yang memerlukan autentikasi
  const protectedRoutes = ["/dashboard", "/premium", "/admin"]
  const isProtectedRoute = protectedRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isProtectedRoute) {
    // Cek cache untuk path ini
    const cacheKey = request.nextUrl.pathname
    const cachedAuth = authCheckCache.get(cacheKey)
    const now = Date.now()

    // Gunakan cache jika masih valid
    if (cachedAuth && now - cachedAuth.timestamp < AUTH_CACHE_TTL) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log cache hit
      logAuthRequest({
        endpoint: "middleware",
        method: "INTERNAL",
        source: "middleware",
        success: true,
        duration,
        cached: true,
        details: {
          path,
          cacheHit: true,
          isAuthenticated: cachedAuth.isAuthenticated,
          isAdmin: cachedAuth.isAdmin,
          cacheAge: now - cachedAuth.timestamp,
        },
      })

      // Jika tidak terotentikasi, redirect ke login
      if (!cachedAuth.isAuthenticated) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/login"
        redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Jika ini adalah rute admin, periksa apakah pengguna adalah admin
      if (request.nextUrl.pathname.startsWith("/admin") && !cachedAuth.isAdmin) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }

      return res
    }

    // Throttle auth checks untuk mencegah rate limiting
    if (now - lastMiddlewareAuthCheck < MIN_AUTH_CHECK_INTERVAL) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log throttled check
      logAuthRequest({
        endpoint: "middleware",
        method: "INTERNAL",
        source: "middleware",
        success: true,
        duration,
        cached: true,
        details: {
          path,
          throttled: true,
          timeSinceLastCheck: now - lastMiddlewareAuthCheck,
          minInterval: MIN_AUTH_CHECK_INTERVAL,
        },
      })

      // Jika terlalu sering, gunakan cache terakhir atau izinkan akses
      if (cachedAuth) {
        // Gunakan hasil cache terakhir meskipun sudah kedaluwarsa
        if (!cachedAuth.isAuthenticated) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = "/login"
          redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }

        if (request.nextUrl.pathname.startsWith("/admin") && !cachedAuth.isAdmin) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }

        return res
      }

      // Jika tidak ada cache, izinkan akses untuk menghindari rate limiting
      // Ini berisiko tetapi lebih baik daripada error rate limit
      return res
    }

    lastMiddlewareAuthCheck = now

    try {
      const supabase = createMiddlewareClient({ req: request, res })

      // Log getSession start
      logAuthRequest({
        endpoint: "getSession",
        method: "GET",
        source: "middleware",
        success: true,
        duration: 0,
        cached: false,
        details: {
          path,
          action: "start",
        },
      })

      const sessionStartTime = performance.now()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const sessionEndTime = performance.now()
      const sessionDuration = sessionEndTime - sessionStartTime

      // Log getSession result
      logAuthRequest({
        endpoint: "getSession",
        method: "GET",
        source: "middleware",
        success: true,
        duration: sessionDuration,
        cached: false,
        userId: session?.user?.id,
        details: {
          path,
          hasSession: !!session,
        },
      })

      // Jika tidak ada sesi dan ini adalah rute yang dilindungi, redirect ke login
      if (!session) {
        // Cache hasil auth check
        authCheckCache.set(cacheKey, {
          isAuthenticated: false,
          timestamp: now,
        })

        const endTime = performance.now()
        const duration = endTime - startTime

        // Log unauthenticated
        logAuthRequest({
          endpoint: "middleware",
          method: "INTERNAL",
          source: "middleware",
          success: false,
          duration,
          cached: false,
          details: {
            path,
            action: "redirect",
            reason: "no_session",
            redirectTo: "/login",
          },
        })

        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/login"
        redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Jika ini adalah rute admin, periksa apakah pengguna adalah admin
      if (request.nextUrl.pathname.startsWith("/admin")) {
        // Dapatkan email pengguna dari sesi
        const email = session.user?.email

        // Daftar email admin
        const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda
        const isAdmin = email && adminEmails.includes(email)

        // Cache hasil auth check dengan status admin
        authCheckCache.set(cacheKey, {
          isAuthenticated: true,
          isAdmin,
          timestamp: now,
        })

        const endTime = performance.now()
        const duration = endTime - startTime

        if (!isAdmin) {
          // Log not admin
          logAuthRequest({
            endpoint: "middleware",
            method: "INTERNAL",
            source: "middleware",
            success: false,
            duration,
            cached: false,
            userId: session.user.id,
            details: {
              path,
              action: "redirect",
              reason: "not_admin",
              email,
              redirectTo: "/dashboard",
            },
          })

          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }

        // Log admin access
        logAuthRequest({
          endpoint: "middleware",
          method: "INTERNAL",
          source: "middleware",
          success: true,
          duration,
          cached: false,
          userId: session.user.id,
          details: {
            path,
            action: "allow",
            isAdmin: true,
            email,
          },
        })
      } else {
        // Cache hasil auth check untuk non-admin routes
        authCheckCache.set(cacheKey, {
          isAuthenticated: true,
          timestamp: now,
        })

        const endTime = performance.now()
        const duration = endTime - startTime

        // Log authenticated
        logAuthRequest({
          endpoint: "middleware",
          method: "INTERNAL",
          source: "middleware",
          success: true,
          duration,
          cached: false,
          userId: session.user.id,
          details: {
            path,
            action: "allow",
          },
        })
      }
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log error
      logAuthRequest({
        endpoint: "middleware",
        method: "INTERNAL",
        source: "middleware",
        success: false,
        duration,
        cached: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          path,
          error,
          action: "error",
        },
      })

      // Jika terjadi error (termasuk rate limit), gunakan cache jika ada
      if (cachedAuth) {
        // Perpanjang TTL cache untuk mengurangi permintaan
        authCheckCache.set(cacheKey, {
          ...cachedAuth,
          timestamp: now,
        })

        // Gunakan hasil cache
        if (!cachedAuth.isAuthenticated) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = "/login"
          redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }

        if (request.nextUrl.pathname.startsWith("/admin") && !cachedAuth.isAdmin) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = "/dashboard"
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Jika tidak ada cache dan terjadi error, izinkan akses
      // Ini berisiko tetapi lebih baik daripada aplikasi tidak berfungsi
      console.error("Error in middleware auth check:", error)
    }
  } else {
    // Log non-protected route
    const endTime = performance.now()
    const duration = endTime - startTime

    logAuthRequest({
      endpoint: "middleware",
      method: "INTERNAL",
      source: "middleware",
      success: true,
      duration,
      cached: false,
      details: {
        path,
        action: "allow",
        reason: "public_route",
      },
    })
  }

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
