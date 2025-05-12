import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/database.types"

// Tambahkan cache untuk middleware
const MIDDLEWARE_CACHE_DURATION = 30 * 1000 // 30 detik
const middlewareCache = new Map<string, { result: NextResponse; timestamp: number }>()

// Tambahkan tracking untuk permintaan auth
interface AuthRequestLog {
  timestamp: number
  path: string
  success: boolean
  duration: number
  cached: boolean
}

// Simpan log di memory (akan hilang saat server restart)
// Untuk implementasi produksi, sebaiknya simpan di database
const authRequestLogs: AuthRequestLog[] = []

// Fungsi untuk menyimpan log ke localStorage saat di client
function storeAuthRequestLog(log: AuthRequestLog) {
  // Simpan log ke array memory
  authRequestLogs.push(log)

  // Batasi jumlah log yang disimpan
  if (authRequestLogs.length > 1000) {
    authRequestLogs.shift() // Hapus log tertua
  }

  // Di middleware server, kita tidak bisa mengakses localStorage
  // Untuk implementasi produksi, kirim log ke endpoint API
}

export async function middleware(req: NextRequest) {
  // Jangan jalankan middleware untuk rute statis atau auth callback
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/static") ||
    req.nextUrl.pathname.startsWith("/auth/callback") ||
    req.nextUrl.pathname.includes(".") // Untuk file statis seperti .js, .css, dll.
  ) {
    return NextResponse.next()
  }

  // Cek apakah ini adalah rute yang memerlukan auth
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")

  // Jika bukan rute yang dilindungi, lewati pengecekan auth
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Cek cache untuk rute ini
  const cacheKey = req.nextUrl.pathname + req.cookies.toString()
  const cachedResponse = middlewareCache.get(cacheKey)
  const now = Date.now()

  if (cachedResponse && now - cachedResponse.timestamp < MIDDLEWARE_CACHE_DURATION) {
    // Gunakan respons dari cache jika masih valid
    // Catat penggunaan cache
    storeAuthRequestLog({
      timestamp: now,
      path: req.nextUrl.pathname,
      success: true,
      duration: 0,
      cached: true,
    })

    return cachedResponse.result
  }

  // Jika tidak ada di cache atau sudah kedaluwarsa, lakukan pengecekan auth
  console.log("🔍 MIDDLEWARE: Processing request for path:", req.nextUrl.pathname)

  const startTime = performance.now()
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    // Refresh session if expired
    console.log("🔍 MIDDLEWARE: Getting session")
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const endTime = performance.now()
    const duration = endTime - startTime

    if (sessionError) {
      console.error("❌ MIDDLEWARE: Error getting session:", sessionError)

      // Catat error
      storeAuthRequestLog({
        timestamp: now,
        path: req.nextUrl.pathname,
        success: false,
        duration,
        cached: false,
      })

      // For protected routes, redirect to login on session error
      if (isProtectedRoute) {
        const redirectUrl = new URL("/login", req.url)
        redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
        redirectUrl.searchParams.set("error", "session_error")

        const redirectResponse = NextResponse.redirect(redirectUrl)
        // Cache respons redirect
        middlewareCache.set(cacheKey, { result: redirectResponse, timestamp: now })
        return redirectResponse
      }

      return res
    }

    // Jika ada sesi, verifikasi dengan getUser untuk keamanan
    let userData = null
    let userError = null

    if (sessionData.session) {
      const { data: verifiedData, error: verifyError } = await supabase.auth.getUser()
      userData = verifiedData
      userError = verifyError

      if (verifyError) {
        console.error("❌ MIDDLEWARE: Error verifying user:", verifyError)
      }
    }

    if (userError) {
      console.error("❌ MIDDLEWARE: Error verifying user:", userError)

      // Catat error
      storeAuthRequestLog({
        timestamp: now,
        path: req.nextUrl.pathname,
        success: false,
        duration,
        cached: false,
      })

      // If token refresh error, redirect to login for protected routes
      if (
        isProtectedRoute &&
        (userError.message?.includes("refresh_token_already_used") || userError.name === "AuthApiError")
      ) {
        console.log("❌ MIDDLEWARE: Auth token error, redirecting to login")
        const redirectUrl = new URL("/login", req.url)
        redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
        redirectUrl.searchParams.set("error", "session_expired")

        const redirectResponse = NextResponse.redirect(redirectUrl)
        // Cache respons redirect
        middlewareCache.set(cacheKey, { result: redirectResponse, timestamp: now })
        return redirectResponse
      }
    }

    console.log("🔍 MIDDLEWARE: Session exists?", !!sessionData.session)

    // Protect dashboard route
    if (isProtectedRoute) {
      console.log("🔍 MIDDLEWARE: Checking auth for protected route:", req.nextUrl.pathname)

      if (!sessionData.session || !userData?.user) {
        console.log("❌ MIDDLEWARE: No valid session, redirecting to login")
        const redirectUrl = new URL("/login", req.url)
        redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
        console.log("🔍 MIDDLEWARE: Redirect URL:", redirectUrl.toString())

        const redirectResponse = NextResponse.redirect(redirectUrl)
        // Cache respons redirect
        middlewareCache.set(cacheKey, { result: redirectResponse, timestamp: now })
        return redirectResponse
      }

      // Catatan: getUser() mungkin tidak tersedia di middleware
      // Verifikasi tambahan sebaiknya dilakukan di server components

      console.log("✅ MIDDLEWARE: User authenticated, allowing access to:", req.nextUrl.pathname)
    }

    console.log("✅ MIDDLEWARE: Request processing complete for:", req.nextUrl.pathname)

    // Cache respons sukses
    middlewareCache.set(cacheKey, { result: res, timestamp: now })

    // Jika ada logika yang menangani redirect setelah pembayaran, pastikan mengarahkan ke /premium
    // Cari bagian yang menangani parameter payment atau order_id dan ubah logika redirectnya

    const url = new URL(req.url)
    if (url.searchParams.has("order_id") || url.searchParams.has("status")) {
      // Ubah dari redirect ke dashboard menjadi redirect ke premium
      // Dari:
      // return NextResponse.redirect(new URL('/dashboard', req.url))

      // Menjadi:
      return NextResponse.redirect(new URL("/premium", req.url))
    }

    // Catat permintaan berhasil
    storeAuthRequestLog({
      timestamp: now,
      path: req.nextUrl.pathname,
      success: !!userData?.user,
      duration,
      cached: false,
    })

    return res
  } catch (error) {
    console.error("❌ MIDDLEWARE: Unexpected error:", error)

    const endTime = performance.now()
    const duration = endTime - startTime

    // Catat error
    storeAuthRequestLog({
      timestamp: now,
      path: req.nextUrl.pathname,
      success: false,
      duration,
      cached: false,
    })

    // For protected routes, redirect to login on error
    if (isProtectedRoute) {
      const redirectUrl = new URL("/login", req.url)
      redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
      redirectUrl.searchParams.set("error", "auth_error")
      return NextResponse.redirect(redirectUrl)
    }

    return res
  }
}

// Perbaiki matcher untuk hanya menerapkan middleware pada rute yang perlu
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth/callback (auth callback)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|auth/callback).*)",
  ],
}
