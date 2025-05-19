import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Fungsi untuk mencatat log auth
function logAuthRequest(data: {
  endpoint: string
  method: string
  source: "client" | "server" | "middleware"
  success: boolean
  duration: number
  cached: boolean
  userId?: string
  error?: string
  details?: Record<string, any>
}) {
  // Tambahkan prefix untuk mobile
  const mobilePrefix = data.details?.isMobile ? "📱 " : ""

  // Format log message
  const timestamp = new Date().toISOString()
  const cachedIndicator = data.cached ? "🔄 [CACHED] " : " "
  const statusIndicator = data.success ? "✅" : "❌"
  const durationText = data.duration > 0 ? `${data.duration}ms` : "-"
  const userIdText = data.userId ? `| User: ${data.userId}` : ""
  const errorText = data.error ? `| Error: ${data.error}` : ""

  // Log ke console
  console.log(
    `🔐 AUTH ${statusIndicator} [${data.source.toUpperCase()}] ${mobilePrefix}${cachedIndicator}${timestamp} | ${data.method} ${data.endpoint} | ${durationText} ${userIdText} ${errorText}`,
  )
}

// Fungsi untuk memeriksa apakah rute memerlukan autentikasi
function isProtectedRoute(pathname: string): boolean {
  // Remove language prefix for checking protected routes
  const pathWithoutLang = pathname.replace(/^\/en/, "")

  return (
    pathWithoutLang.startsWith("/dashboard") ||
    pathWithoutLang.startsWith("/admin") ||
    pathWithoutLang.startsWith("/premium") ||
    pathWithoutLang.startsWith("/settings")
  )
}

// Fungsi untuk memeriksa apakah rute adalah rute admin
function isAdminRoute(pathname: string): boolean {
  // Remove language prefix for checking admin routes
  const pathWithoutLang = pathname.replace(/^\/en/, "")

  return pathWithoutLang.startsWith("/admin")
}

// Fungsi untuk memeriksa apakah rute adalah aset statis
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  )
}

// Ubah durasi cache untuk mengurangi permintaan autentikasi
const AUTH_CACHE_TTL = 5 * 60 * 1000 // Tingkatkan menjadi 5 menit (dari 1 menit)

// Tambahkan throttling untuk permintaan auth
const AUTH_REQUEST_LIMIT = 10 // Maksimum 10 permintaan per menit
const AUTH_REQUEST_WINDOW = 60 * 1000 // 1 menit
const authRequestTimestamps = new Map<string, number[]>()

// In-memory cache untuk menyimpan hasil autentikasi
const authCache = new Map<string, { data: any; timestamp: number }>()

// Fungsi untuk memeriksa apakah perlu throttle permintaan auth
function shouldThrottleAuthRequest(ip: string): boolean {
  const now = Date.now()

  // Dapatkan timestamps untuk IP ini
  const timestamps = authRequestTimestamps.get(ip) || []

  // Hapus timestamps yang lebih lama dari jendela waktu
  const recentTimestamps = timestamps.filter((t) => t > now - AUTH_REQUEST_WINDOW)

  // Update timestamps
  authRequestTimestamps.set(ip, recentTimestamps)

  // Jika terlalu banyak permintaan dalam jendela waktu, throttle
  return recentTimestamps.length >= AUTH_REQUEST_LIMIT
}

// Catat timestamp permintaan auth baru
function recordAuthRequestTimestamp(ip: string) {
  const timestamps = authRequestTimestamps.get(ip) || []
  timestamps.push(Date.now())
  authRequestTimestamps.set(ip, timestamps)
}

// Modifikasi middleware untuk menerapkan throttling dan menangani rute bahasa
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle language-specific routes
  if (pathname.startsWith("/en")) {
    // Already has language prefix, no need to modify
  } else {
    // Continue with the existing middleware logic
    // ... (rest of your existing middleware code)
  }

  const userAgent = request.headers.get("user-agent") || ""
  // Tidak perlu deteksi mobile lagi
  const isMobile = false

  // Dapatkan IP pengguna
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

  // Skip middleware untuk aset statis
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Handle language routes for protected pages
  const isEnglishRoute = pathname.startsWith("/en")

  // Jika bukan rute yang dilindungi, lanjutkan
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  // Terapkan throttling untuk permintaan auth
  if (shouldThrottleAuthRequest(ip)) {
    logAuthRequest({
      endpoint: pathname,
      method: request.method,
      source: "middleware",
      success: false,
      duration: 0,
      cached: false,
      error: "Auth request throttled",
      details: { isMobile, reason: "rate_limit" },
    })

    // Jika throttled, gunakan cache jika ada atau redirect ke login
    const cacheKey = `auth:${request.cookies.toString()}:${pathname}`
    const cachedAuth = authCache.get(cacheKey)

    if (cachedAuth && cachedAuth.data.session) {
      return NextResponse.next()
    }

    // Redirect to login with appropriate language prefix
    const loginPath = isEnglishRoute ? "/en/login" : "/login"
    const redirectUrl = new URL(loginPath, request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Catat permintaan auth
  recordAuthRequestTimestamp(ip)

  // Mulai pengukuran waktu
  const startTime = Date.now()

  // Cek cache untuk mengurangi permintaan
  const cacheKey = `auth:${request.cookies.toString()}:${pathname}`
  const cachedAuth = authCache.get(cacheKey)
  let isFromCache = false

  if (cachedAuth && Date.now() - cachedAuth.timestamp < AUTH_CACHE_TTL) {
    isFromCache = true
    // Jika tidak ada sesi di cache, redirect ke login
    if (!cachedAuth.data.session) {
      // Redirect to login with appropriate language prefix
      const loginPath = isEnglishRoute ? "/en/login" : "/login"
      const redirectUrl = new URL(loginPath, request.url)
      redirectUrl.searchParams.set("redirect", pathname)

      logAuthRequest({
        endpoint: pathname,
        method: request.method,
        source: "middleware",
        success: false,
        duration: Date.now() - startTime,
        cached: true,
        error: "No session in cache",
        details: { isMobile },
      })

      return NextResponse.redirect(redirectUrl)
    }

    // Jika rute admin, periksa apakah pengguna adalah admin
    if (isAdminRoute(pathname) && !cachedAuth.data.isAdmin) {
      logAuthRequest({
        endpoint: pathname,
        method: request.method,
        source: "middleware",
        success: false,
        duration: Date.now() - startTime,
        cached: true,
        userId: cachedAuth.data.session?.user?.id,
        error: "Not admin",
        details: { isMobile },
      })

      // Redirect to dashboard with appropriate language prefix
      const dashboardPath = isEnglishRoute ? "/en/dashboard" : "/dashboard"
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }

    logAuthRequest({
      endpoint: pathname,
      method: request.method,
      source: "middleware",
      success: true,
      duration: Date.now() - startTime,
      cached: true,
      userId: cachedAuth.data.session?.user?.id,
      details: { isMobile },
    })

    return NextResponse.next()
  }

  try {
    // Buat klien Supabase
    const supabase = createClient()

    // Dapatkan sesi
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Jika tidak ada sesi, redirect ke login
    if (!session) {
      // Redirect to login with appropriate language prefix
      const loginPath = isEnglishRoute ? "/en/login" : "/login"
      const redirectUrl = new URL(loginPath, request.url)
      redirectUrl.searchParams.set("redirect", pathname)

      logAuthRequest({
        endpoint: pathname,
        method: request.method,
        source: "middleware",
        success: false,
        duration: Date.now() - startTime,
        cached: false,
        error: "No session",
        details: { isMobile },
      })

      return NextResponse.redirect(redirectUrl)
    }

    // Jika rute admin, periksa apakah pengguna adalah admin
    let isAdmin = false
    if (isAdminRoute(pathname)) {
      // Dapatkan email pengguna
      const { data: userData } = await supabase.from("users").select("email").eq("id", session.user.id).single()

      // Daftar email admin
      const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda
      isAdmin = adminEmails.includes(userData?.email || "")

      if (!isAdmin) {
        logAuthRequest({
          endpoint: pathname,
          method: request.method,
          source: "middleware",
          success: false,
          duration: Date.now() - startTime,
          cached: false,
          userId: session.user.id,
          error: "Not admin",
          details: { isMobile },
        })

        // Redirect to dashboard with appropriate language prefix
        const dashboardPath = isEnglishRoute ? "/en/dashboard" : "/dashboard"
        return NextResponse.redirect(new URL(dashboardPath, request.url))
      }
    }

    // Simpan ke cache dengan TTL yang lebih lama
    authCache.set(cacheKey, {
      data: { session, isAdmin },
      timestamp: Date.now(),
    })

    logAuthRequest({
      endpoint: pathname,
      method: request.method,
      source: "middleware",
      success: true,
      duration: Date.now() - startTime,
      cached: false,
      userId: session.user.id,
      details: { isMobile },
    })

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)

    logAuthRequest({
      endpoint: pathname,
      method: request.method,
      source: "middleware",
      success: false,
      duration: Date.now() - startTime,
      cached: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: { isMobile, error },
    })

    // Redirect to login with appropriate language prefix
    const loginPath = isEnglishRoute ? "/en/login" : "/login"
    const redirectUrl = new URL(loginPath, request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
