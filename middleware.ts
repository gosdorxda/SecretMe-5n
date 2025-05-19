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
  const supabase = createClient()

  // Check if the path is for a language-specific route
  const isEnglishRoute = pathname.startsWith("/en/")
  const basePath = isEnglishRoute ? pathname.replace(/^\/en/, "") : pathname
  const languagePrefix = isEnglishRoute ? "/en" : ""

  // Skip middleware for static files, API routes, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Handle authentication for protected routes
  if (basePath.startsWith("/dashboard") || basePath.startsWith("/premium") || basePath.startsWith("/admin")) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Redirect to login page with the appropriate language prefix
      return NextResponse.redirect(new URL(`${languagePrefix}/login`, request.url))
    }

    // For admin routes, check if user has admin role
    if (basePath.startsWith("/admin")) {
      const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      if (!user || user.role !== "admin") {
        // Redirect to dashboard with the appropriate language prefix
        return NextResponse.redirect(new URL(`${languagePrefix}/dashboard`, request.url))
      }
    }
  }

  // Handle numeric ID to username redirects for profile pages
  if ((basePath.match(/^\/\d+$/) || (isEnglishRoute && basePath.match(/^\/\d+$/))) && !basePath.startsWith("/api/")) {
    const numericId = Number.parseInt(basePath.substring(1), 10)

    if (!isNaN(numericId)) {
      const { data: user } = await supabase
        .from("users")
        .select("username, is_premium")
        .eq("numeric_id", numericId)
        .single()

      if (user && user.is_premium && user.username) {
        // Redirect to username URL with the appropriate language prefix
        return NextResponse.redirect(new URL(`${languagePrefix}/${user.username}`, request.url))
      }
    }
  }

  return NextResponse.next()
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
