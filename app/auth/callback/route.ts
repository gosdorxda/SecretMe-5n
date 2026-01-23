import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logAuthRequest } from "@/lib/auth-logger"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/dashboard"

  // Log callback start
  logAuthRequest({
    endpoint: "authCallback",
    method: "GET",
    source: "server",
    success: true,
    duration: 0,
    cached: false,
    details: {
      hasCode: !!code,
      redirectTo,
      action: "start",
    },
  })

  const startTime = performance.now()

  // Jika tidak ada kode, redirect ke login dengan error
  if (!code) {
    const duration = performance.now() - startTime

    // Log error
    logAuthRequest({
      endpoint: "authCallback",
      method: "GET",
      source: "server",
      success: false,
      duration,
      cached: false,
      error: "No code parameter",
      details: {
        action: "redirect",
        redirectTo: "/login",
        error: "no_code_parameter",
      },
    })

    return NextResponse.redirect(
      new URL(`/login?error=no_code_parameter&message=No code parameter found`, requestUrl.origin),
    )
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    // Log exchange code start
    logAuthRequest({
      endpoint: "authCallback/exchangeCode",
      method: "GET",
      source: "server",
      success: true,
      duration: 0,
      cached: false,
      details: {
        action: "start",
      },
    })

    const exchangeStartTime = performance.now()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    const exchangeDuration = performance.now() - exchangeStartTime

    if (error) {
      // Log exchange error
      logAuthRequest({
        endpoint: "authCallback/exchangeCode",
        method: "GET",
        source: "server",
        success: false,
        duration: exchangeDuration,
        cached: false,
        error: error.message,
        details: {
          errorCode: error.code,
          errorStatus: error.status,
          action: "failed",
        },
      })

      return NextResponse.redirect(
        new URL(`/login?error=auth_callback_error&message=${encodeURIComponent(error.message)}`, requestUrl.origin),
      )
    }

    // Log exchange success
    logAuthRequest({
      endpoint: "authCallback/exchangeCode",
      method: "GET",
      source: "server",
      success: true,
      duration: exchangeDuration,
      cached: false,
      userId: data.session?.user.id,
      details: {
        action: "success",
        hasSession: !!data.session,
      },
    })

    // Jika tidak ada sesi setelah exchange, redirect ke login dengan error
    if (!data.session) {
      const duration = performance.now() - startTime

      // Log no session error
      logAuthRequest({
        endpoint: "authCallback",
        method: "GET",
        source: "server",
        success: false,
        duration,
        cached: false,
        error: "No session after exchange",
        details: {
          action: "redirect",
          redirectTo: "/login",
          error: "no_session_after_exchange",
        },
      })

      return NextResponse.redirect(
        new URL(`/login?error=no_session_after_exchange&message=No session after code exchange`, requestUrl.origin),
      )
    }

    // Verifikasi sesi dengan getSession
    try {
      // Log verify session start
      logAuthRequest({
        endpoint: "authCallback/verifySession",
        method: "GET",
        source: "server",
        success: true,
        duration: 0,
        cached: false,
        userId: data.session.user.id,
        details: {
          action: "start",
        },
      })

      const verifyStartTime = performance.now()

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      const verifyDuration = performance.now() - verifyStartTime

      if (sessionError) {
        // Log verify error
        logAuthRequest({
          endpoint: "authCallback/verifySession",
          method: "GET",
          source: "server",
          success: false,
          duration: verifyDuration,
          cached: false,
          userId: data.session.user.id,
          error: sessionError.message,
          details: {
            errorCode: sessionError.code,
            errorStatus: sessionError.status,
            action: "failed",
          },
        })

        return NextResponse.redirect(
          new URL(`/login?error=session_error&message=${encodeURIComponent(sessionError.message)}`, requestUrl.origin),
        )
      }

      // Log verify success
      logAuthRequest({
        endpoint: "authCallback/verifySession",
        method: "GET",
        source: "server",
        success: true,
        duration: verifyDuration,
        cached: false,
        userId: data.session.user.id,
        details: {
          action: "success",
          hasSession: !!sessionData.session,
        },
      })

      // Jika tidak ada sesi setelah verifikasi, redirect ke login dengan error
      if (!sessionData.session) {
        const duration = performance.now() - startTime

        // Log no session data error
        logAuthRequest({
          endpoint: "authCallback",
          method: "GET",
          source: "server",
          success: false,
          duration,
          cached: false,
          userId: data.session.user.id,
          error: "No session data",
          details: {
            action: "redirect",
            redirectTo: "/login",
            error: "no_session_data",
          },
        })

        return NextResponse.redirect(
          new URL(`/login?error=no_session_data&message=No session data after verification`, requestUrl.origin),
        )
      }
    } catch (verifyError: any) {
      const duration = performance.now() - startTime

      // Log verify exception
      logAuthRequest({
        endpoint: "authCallback",
        method: "GET",
        source: "server",
        success: false,
        duration,
        cached: false,
        userId: data.session.user.id,
        error: verifyError instanceof Error ? verifyError.message : "Unknown error",
        details: {
          action: "redirect",
          redirectTo: "/login",
          error: "session_error",
        },
      })

      return NextResponse.redirect(
        new URL(
          `/login?error=session_error&message=${encodeURIComponent(
            verifyError instanceof Error ? verifyError.message : "Unknown error",
          )}`,
          requestUrl.origin,
        ),
      )
    }

    // Periksa apakah user sudah ada di database
    try {
      // Log check user start
      logAuthRequest({
        endpoint: "authCallback/checkUser",
        method: "GET",
        source: "server",
        success: true,
        duration: 0,
        cached: false,
        userId: data.session.user.id,
        details: {
          action: "start",
        },
      })

      const checkStartTime = performance.now()

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.session.user.id)
        .single()

      const checkDuration = performance.now() - checkStartTime

      if (userError) {
        // Log check user error
        logAuthRequest({
          endpoint: "authCallback/checkUser",
          method: "GET",
          source: "server",
          success: false,
          duration: checkDuration,
          cached: false,
          userId: data.session.user.id,
          error: userError.message,
          details: {
            errorCode: userError.code,
            action: userError.code === "PGRST116" ? "userNotFound" : "failed",
          },
        })

        // Jika user tidak ditemukan, buat user baru
        if (userError.code === "PGRST116") {
          // Log create user start
          logAuthRequest({
            endpoint: "authCallback/createUser",
            method: "POST",
            source: "server",
            success: true,
            duration: 0,
            cached: false,
            userId: data.session.user.id,
            details: {
              action: "start",
            },
          })

          const createStartTime = performance.now()

          const { error: insertError } = await supabase.from("users").insert({
            id: data.session.user.id,
            name:
              data.session.user.user_metadata.full_name ||
              data.session.user.user_metadata.name ||
              data.session.user.email?.split("@")[0] ||
              "User",
            email: data.session.user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_premium: false,
            allow_public_replies: false,
          })

          const createDuration = performance.now() - createStartTime

          if (insertError) {
            // Log create user error
            logAuthRequest({
              endpoint: "authCallback/createUser",
              method: "POST",
              source: "server",
              success: false,
              duration: createDuration,
              cached: false,
              userId: data.session.user.id,
              error: insertError.message,
              details: {
                errorCode: insertError.code,
                action: "failed",
              },
            })

            return NextResponse.redirect(
              new URL(
                `/login?error=user_creation_failed&message=${encodeURIComponent(insertError.message)}`,
                requestUrl.origin,
              ),
            )
          }

          // Log create user success
          logAuthRequest({
            endpoint: "authCallback/createUser",
            method: "POST",
            source: "server",
            success: true,
            duration: createDuration,
            cached: false,
            userId: data.session.user.id,
            details: {
              action: "success",
            },
          })
        } else {
          // Jika error bukan karena user tidak ditemukan, redirect ke login dengan error
          return NextResponse.redirect(
            new URL(`/login?error=database_error&message=${encodeURIComponent(userError.message)}`, requestUrl.origin),
          )
        }
      } else {
        // Log check user success
        logAuthRequest({
          endpoint: "authCallback/checkUser",
          method: "GET",
          source: "server",
          success: true,
          duration: checkDuration,
          cached: false,
          userId: data.session.user.id,
          details: {
            action: "success",
            userExists: true,
          },
        })
      }
    } catch (dbError: any) {
      const duration = performance.now() - startTime

      // Log database exception
      logAuthRequest({
        endpoint: "authCallback",
        method: "GET",
        source: "server",
        success: false,
        duration,
        cached: false,
        userId: data.session.user.id,
        error: dbError instanceof Error ? dbError.message : "Unknown error",
        details: {
          action: "redirect",
          redirectTo: "/login",
          error: "database_error",
        },
      })

      return NextResponse.redirect(
        new URL(
          `/login?error=database_error&message=${encodeURIComponent(
            dbError instanceof Error ? dbError.message : "Unknown database error",
          )}`,
          requestUrl.origin,
        ),
      )
    }

    const duration = performance.now() - startTime

    // Log callback success
    logAuthRequest({
      endpoint: "authCallback",
      method: "GET",
      source: "server",
      success: true,
      duration,
      cached: false,
      userId: data.session.user.id,
      details: {
        action: "redirect",
        redirectTo,
      },
    })

    // Redirect ke halaman yang diminta
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
  } catch (error: any) {
    const duration = performance.now() - startTime

    // Log unexpected error
    logAuthRequest({
      endpoint: "authCallback",
      method: "GET",
      source: "server",
      success: false,
      duration,
      cached: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        action: "redirect",
        redirectTo: "/login",
        error: "unexpected_error",
      },
    })

    return NextResponse.redirect(
      new URL(
        `/login?error=unexpected_error&message=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error",
        )}`,
        requestUrl.origin,
      ),
    )
  }
}
