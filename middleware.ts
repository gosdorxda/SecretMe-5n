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
const authCheckCache = new Map<
  string,
  { isAuthenticated: boolean; timestamp: number; isAdmin?: boolean; userAgent?: string; userId?: string }
>()
const AUTH_CACHE_TTL = 300000 // 5 menit (dari 1 menit)
const MOBILE_AUTH_CACHE_TTL = 120000 // 2 menit untuk mobile (dari 3 menit)

// Throttling untuk middleware auth checks
let lastMiddlewareAuthCheck = 0
const MIN_AUTH_CHECK_INTERVAL = 5000 // 5 detik
const MOBILE_MIN_AUTH_CHECK_INTERVAL = 3000 // 3 detik untuk mobile

// Fungsi untuk mendeteksi perangkat mobile
function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

// Fungsi untuk menangani error middleware
async function handleMiddlewareError(
  request: NextRequest,
  error: any,
  cachedAuth:
    | { isAuthenticated: boolean; timestamp: number; isAdmin?: boolean; userAgent?: string; userId?: string }
    | undefined,
  path: string,
  startTime: number,
  isMobile: boolean,
) {
  const endTime = performance.now()
  const duration = endTime - startTime
  const now = Date.now()

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
      isMobile,
      errorCode: error.code,
      errorStatus: error.status,
      errorName: error.name,
    },
  })

  // Jika terjadi error (termasuk rate limit), gunakan cache jika ada
  if (cachedAuth) {
    // Perpanjang TTL cache untuk mengurangi permintaan
    const cacheKey = request.nextUrl.pathname
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

  // Tambahkan parameter error ke URL untuk debugging
  const res = NextResponse.next()
  const url = request.nextUrl.clone()

  // Jika ini adalah error rate limit, tambahkan parameter
  if (error.status === 429 || (error.message && error.message.includes("rate limit"))) {
    url.searchParams.set("auth_error", "rate_limit")
    return NextResponse.redirect(url)
  }

  // Jika ini adalah error autentikasi, tambahkan parameter
  if (error.status === 401 || error.message?.includes("auth") || error.message?.includes("token")) {
    url.searchParams.set("auth_error", "auth_failed")
    return NextResponse.redirect(url)
  }

  return res
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const path = request.nextUrl.pathname
  const userAgent = request.headers.get("user-agent")
  const isMobile = isMobileUserAgent(userAgent)

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
      userAgent: userAgent || undefined,
      ip: request.ip || request.headers.get("x-forwarded-for") || undefined,
      isMobile,
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

    // Gunakan cache jika masih valid, dengan TTL yang berbeda untuk mobile
    const cacheTTL = isMobile ? MOBILE_AUTH_CACHE_TTL : AUTH_CACHE_TTL
    if (cachedAuth && now - cachedAuth.timestamp < cacheTTL) {
      // Periksa apakah user agent cocok untuk mencegah penggunaan cache yang salah
      const cachedUserAgent = cachedAuth.userAgent || ""
      const currentIsMobile = isMobile
      const cachedIsMobile = isMobileUserAgent(cachedUserAgent)

      // Jika tipe perangkat berbeda, jangan gunakan cache
      if (currentIsMobile !== cachedIsMobile) {
        // Log cache mismatch
        logAuthRequest({
          endpoint: "middleware",
          method: "INTERNAL",
          source: "middleware",
          success: true,
          duration: 0,
          cached: true,
          details: {
            path,
            cacheMismatch: true,
            currentIsMobile,
            cachedIsMobile,
            action: "skip_cache",
          },
        })
      }
      // Tambahkan pengecekan usia cache untuk mobile
      else if (isMobile && now - cachedAuth.timestamp > 60000) {
        // Jika cache > 1 menit untuk mobile
        // Log cache age check
        logAuthRequest({
          endpoint: "middleware",
          method: "INTERNAL",
          source: "middleware",
          success: true,
          duration: 0,
          cached: true,
          details: {
            path,
            cacheAgeCheck: true,
            cacheAge: now - cachedAuth.timestamp,
            action: "skip_cache_mobile",
          },
        })
      } else {
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
          userId: cachedAuth.userId,
          details: {
            path,
            cacheHit: true,
            isAuthenticated: cachedAuth.isAuthenticated,
            isAdmin: cachedAuth.isAdmin,
            cacheAge: now - cachedAuth.timestamp,
            isMobile,
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
    }

    // Throttle auth checks untuk mencegah rate limiting, dengan interval yang berbeda untuk mobile
    const minInterval = isMobile ? MOBILE_MIN_AUTH_CHECK_INTERVAL : MIN_AUTH_CHECK_INTERVAL
    if (now - lastMiddlewareAuthCheck < minInterval) {
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
          minInterval,
          isMobile,
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
          isMobile,
        },
      })

      const sessionStartTime = performance.now()

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      const sessionEndTime = performance.now()
      const sessionDuration = sessionEndTime - sessionStartTime

      // Handle session error
      if (sessionError) {
        return handleMiddlewareError(request, sessionError, cachedAuth, path, startTime, isMobile)
      }

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
          isMobile,
        },
      })

      // Jika tidak ada sesi dan ini adalah rute yang dilindungi, redirect ke login
      if (!session) {
        // Cache hasil auth check
        authCheckCache.set(cacheKey, {
          isAuthenticated: false,
          timestamp: now,
          userAgent: userAgent || undefined,
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
            isMobile,
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
          userAgent: userAgent || undefined,
          userId: session.user.id,
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
              isMobile,
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
            isMobile,
          },
        })
      } else {
        // Cache hasil auth check untuk non-admin routes
        authCheckCache.set(cacheKey, {
          isAuthenticated: true,
          timestamp: now,
          userAgent: userAgent || undefined,
          userId: session.user.id,
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
            isMobile,
          },
        })
      }
    } catch (error) {
      return handleMiddlewareError(request, error, cachedAuth, path, startTime, isMobile)
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
        isMobile,
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
