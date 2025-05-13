import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh session jika ada
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Jika tidak ada session dan mencoba mengakses halaman yang dilindungi
  const protectedPaths = ["/dashboard", "/admin", "/premium"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!session && isProtectedPath) {
    // Redirect ke login dengan parameter redirect
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Jika ada session tapi mencoba mengakses halaman login/register
  const authPaths = ["/login", "/register"]
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname === path)

  if (session && isAuthPath) {
    // Redirect ke dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

// Tentukan path yang akan diproses oleh middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require authentication
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/payment/notification|api/telegram/webhook).*)",
  ],
}
