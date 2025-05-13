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
const lastMiddlewareAuthCheck = 0
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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Jika pengguna mencoba mengakses halaman admin
  if (req.nextUrl.pathname.startsWith("/adm")) {
    if (!session) {
      // Redirect ke halaman login jika tidak ada sesi
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Periksa apakah pengguna adalah admin
    const { data: userData } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!userData || userData.role !== "admin") {
      // Redirect ke halaman utama jika bukan admin
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/adm/:path*"],
}
