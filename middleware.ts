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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  console.log("🔍 MIDDLEWARE: Processing request for path:", req.nextUrl.pathname)

  // Periksa apakah ini adalah rute yang memerlukan autentikasi
  const protectedRoutes = ["/dashboard", "/premium", "/admin"]
  const isProtectedRoute = protectedRoutes.some(
    (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isProtectedRoute) {
    console.log("🔍 MIDDLEWARE: Getting session")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    console.log("🔍 MIDDLEWARE: Session exists?", !!session)

    console.log("🔍 MIDDLEWARE: Checking auth for protected route:", req.nextUrl.pathname)

    // Jika tidak ada sesi dan ini adalah rute yang dilindungi, redirect ke login
    if (!session) {
      console.log("❌ MIDDLEWARE: No session, redirecting to login")
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

      if (!email || !adminEmails.includes(email)) {
        console.log("❌ MIDDLEWARE: User is not admin, redirecting to dashboard")
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = "/dashboard"
        return NextResponse.redirect(redirectUrl)
      }
    }

    console.log("✅ MIDDLEWARE: User authenticated, allowing access to:", req.nextUrl.pathname)
  }

  console.log("✅ MIDDLEWARE: Request processing complete for:", req.nextUrl.pathname)
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
