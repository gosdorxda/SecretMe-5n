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
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/premium") ||
    pathname.startsWith("/settings")
  )
}

// Fungsi untuk memeriksa apakah rute adalah rute admin
function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin")
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

// Cache untuk mengurangi permintaan autentikasi
const AUTH_CACHE_TTL = 60 * 1000 // 1 menit
const authCache = new Map<string, { data: any; timestamp: number }>()

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get("user-agent") || ""
  // Tidak perlu deteksi mobile lagi
  const isMobile = false

  // Skip middleware untuk aset statis
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  // Jika bukan rute yang dilindungi, lanjutkan
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

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
      const redirectUrl = new URL("/login", request.url)
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

      return NextResponse.redirect(new URL("/dashboard", request.url))
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
      const redirectUrl = new URL("/login", request.url)
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

        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }

    // Simpan ke cache
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

    // Jika terjadi error, redirect ke login
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
}
