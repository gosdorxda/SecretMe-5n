import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session untuk semua rute yang cocok dengan matcher
  // Ini akan menyimpan session dalam cookie dan mengurangi kebutuhan
  // untuk memanggil getSession() berulang kali
  await supabase.auth.getSession()

  // Untuk rute admin, verifikasi akses
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Redirect ke halaman login jika tidak ada sesi
      return NextResponse.redirect(new URL("/login?redirect=/admin", req.url))
    }

    try {
      // Periksa apakah pengguna adalah admin
      // Catatan: Ini masih melakukan query database, tapi hanya untuk rute admin
      // yang seharusnya jarang diakses dibandingkan rute lain
      const { data: userData, error } = await supabase.from("users").select("email").eq("id", session.user.id).single()

      if (error) {
        console.error("Error checking admin status:", error)
        return NextResponse.redirect(new URL("/", req.url))
      }

      const adminEmails = ["gosdorxda@gmail.com"] // Email admin
      const isAdminUser = adminEmails.includes(userData?.email || "")

      if (!isAdminUser) {
        // Redirect ke halaman utama jika bukan admin
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url))
      }
    } catch (error) {
      console.error("Error in middleware:", error)
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return res
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
