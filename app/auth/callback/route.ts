import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("🔍 AUTH CALLBACK: Started processing", new Date().toISOString())

  const requestUrl = new URL(request.url)
  console.log("🔍 AUTH CALLBACK: Request URL", requestUrl.toString())

  const code = requestUrl.searchParams.get("code")
  console.log("🔍 AUTH CALLBACK: Auth code exists?", !!code)

  // Ambil parameter redirect_to dari query string jika ada
  let redirectTo = "/dashboard"

  // Cek apakah ada parameter redirect di URL
  const redirectParam = requestUrl.searchParams.get("redirect_to") || requestUrl.searchParams.get("redirect")
  if (redirectParam) {
    redirectTo = redirectParam
    console.log("🔍 AUTH CALLBACK: Custom redirect target:", redirectTo)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  console.log("🔍 AUTH CALLBACK: Using app URL:", appUrl)

  if (!code) {
    console.error("❌ AUTH CALLBACK: No code parameter in URL")
    return NextResponse.redirect(new URL("/login?error=no_code_parameter", appUrl))
  }

  try {
    const supabase = createClient()
    console.log("🔍 AUTH CALLBACK: Supabase client created")

    // Exchange the code for a session
    console.log("🔍 AUTH CALLBACK: Exchanging code for session...")
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("❌ AUTH CALLBACK: Error exchanging code for session:", exchangeError)
      return NextResponse.redirect(
        new URL(`/login?error=auth_callback_error&message=${encodeURIComponent(exchangeError.message)}`, appUrl),
      )
    }

    if (!sessionData?.session) {
      console.error("❌ AUTH CALLBACK: No session data after exchange")
      return NextResponse.redirect(new URL(`/login?error=no_session_data`, appUrl))
    }

    console.log("✅ AUTH CALLBACK: Session exchange successful, user ID:", sessionData.session.user.id)

    // Tambahkan cookie secara manual untuk memastikan
    // Gunakan origin dari request URL untuk redirect, bukan hardcoded localhost
    const response = NextResponse.redirect(new URL(redirectTo, appUrl))

    // Tambahkan cookie secara eksplisit dengan opsi yang benar
    const secure = process.env.NODE_ENV === "production"
    const cookieStr = `sb-auth-token=${sessionData.session.access_token}; Path=/; Max-Age=${60 * 60 * 8}; ${secure ? "Secure; " : ""}SameSite=Lax`
    response.headers.append("Set-Cookie", cookieStr)

    // Tambahkan header untuk mencegah caching
    response.headers.append("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate")
    response.headers.append("Pragma", "no-cache")
    response.headers.append("Expires", "0")

    // Verifikasi session dengan getSession
    console.log("🔍 AUTH CALLBACK: Verifying session...")
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ AUTH CALLBACK: Error getting session:", sessionError)
      return NextResponse.redirect(
        new URL(`/login?error=session_verification_error&message=${encodeURIComponent(sessionError.message)}`, appUrl),
      )
    }

    if (!session) {
      console.warn("⚠️ AUTH CALLBACK: No session after verification, but continuing with manual cookie")

      // Tambahan: Verifikasi user dengan getUser() untuk keamanan ekstra
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("❌ AUTH CALLBACK: User verification failed:", userError)
        return NextResponse.redirect(
          new URL(
            `/login?error=user_verification_error&message=${encodeURIComponent(userError?.message || "User verification failed")}`,
            appUrl,
          ),
        )
      }
    } else {
      console.log("✅ AUTH CALLBACK: Session verified successfully")
    }

    // Gunakan sessionData.session karena kita yakin ini ada
    const userId = sessionData.session.user.id
    const userEmail = sessionData.session.user.email || ""

    // Tambahkan penanganan untuk metadata dari Twitter
    const userName =
      sessionData.session.user.user_metadata.full_name ||
      sessionData.session.user.user_metadata.name ||
      sessionData.session.user.user_metadata.custom_claims?.name || // Untuk Facebook
      sessionData.session.user.user_metadata.user_name || // Untuk Twitter
      userEmail.split("@")[0] ||
      "User"

    // Check if user exists in our users table
    console.log("🔍 AUTH CALLBACK: Checking if user exists in database...")
    const { data: existingUser, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    // Jika terjadi error selain "not found", redirect ke halaman error
    if (userError && userError.code !== "PGRST116") {
      console.error("❌ AUTH CALLBACK: Error checking user:", userError)
      // Tetap lanjutkan, karena kita sudah memiliki sesi yang valid
    }

    // If user doesn't exist in our users table, create a new record
    if (!existingUser) {
      console.log("🔍 AUTH CALLBACK: User not found in database, creating new record")

      // Create a new user record
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        name: userName,
        email: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_premium: false,
        allow_public_replies: false, // Set default ke false untuk pengguna baru
      })

      if (insertError) {
        console.error("❌ AUTH CALLBACK: Error creating user record:", insertError)
        // Tetap lanjutkan, karena kita sudah memiliki sesi yang valid
      } else {
        console.log("✅ AUTH CALLBACK: User record created successfully")
      }
    } else {
      console.log("✅ AUTH CALLBACK: User exists in database")
    }

    console.log("✅ AUTH CALLBACK: Redirecting to:", redirectTo)
    return response
  } catch (error: any) {
    console.error("❌ AUTH CALLBACK: Unexpected error:", error)
    return NextResponse.redirect(
      new URL(`/login?error=unexpected_error&message=${encodeURIComponent(error.message || "Unknown error")}`, appUrl),
    )
  }
}
