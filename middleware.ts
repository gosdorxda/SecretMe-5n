import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session untuk semua rute yang cocok dengan matcher
    // Ini akan menyimpan session dalam cookie dan mengurangi kebutuhan
    // untuk memanggil getSession() berulang kali
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Untuk dashboard dan rute yang dilindungi, verifikasi session
    if ((req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/premium")) && !session) {
      // Redirect ke halaman login dengan URL asli sebagai parameter redirect
      const redirectUrl = req.nextUrl.pathname + req.nextUrl.search
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(redirectUrl)}`, req.url))
    }

    // Untuk rute admin, verifikasi akses admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (!session) {
        // Redirect ke halaman login jika tidak ada sesi
        return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url))
      }

      try {
        // Periksa apakah pengguna adalah admin
        const { data: userData, error } = await supabase
          .from("users")
          .select("email")
          .eq("id", session.user.id)
          .single()

        if (error) {
          console.error("Error checking admin status:", error)
          return NextResponse.redirect(new URL("/", req.url))
        }

        const adminEmails = ["gosdorxda@gmail.com"] // Email admin
        const isAdminUser = adminEmails.includes(userData?.email || "")

        if (!isAdminUser) {
          // Redirect ke dashboard jika bukan admin
          return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url))
        }
      } catch (error) {
        console.error("Error in middleware:", error)
        return NextResponse.redirect(new URL("/", req.url))
      }
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // Untuk error kritis, redirect ke halaman utama
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
     * Match semua request paths kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * - api routes yang tidak memerlukan auth
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/public).*)",
  ],
}
