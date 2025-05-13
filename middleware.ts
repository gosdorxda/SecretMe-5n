import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session jika ada
  await supabase.auth.getSession()

  return res
}

// Jalankan middleware pada semua routes
// Anda bisa membatasi ini hanya ke routes tertentu jika diperlukan
export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (folder images jika ada)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.png$).*)",
  ],
}
