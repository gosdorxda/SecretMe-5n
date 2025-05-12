import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"
import { logAuthRequest } from "@/lib/auth-logger"

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

// Server-side Supabase client
export const createClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
    options: {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        cookieOptions: {
          name: "sb-auth-token",
          lifetime: 60 * 60 * 8,
          domain: "",
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        },
      },
      global: {
        fetch: (url, options) => {
          // Periksa apakah ini adalah permintaan auth
          const isAuthRequest =
            url.toString().includes("/auth/") ||
            (options?.headers && (options.headers as any)["X-Client-Info"]?.includes("supabase-js"))

          if (isAuthRequest) {
            const urlStr = url.toString()
            const method = options?.method || "GET"

            // Tentukan endpoint
            let endpoint = "unknown"
            if (urlStr.includes("/auth/v1/token")) endpoint = "refreshToken"
            else if (urlStr.includes("/auth/v1/logout")) endpoint = "signOut"
            else if (urlStr.includes("/auth/v1/user")) endpoint = "getUser"
            else if (urlStr.includes("/auth/v1/session")) endpoint = "getSession"
            else {
              // Ekstrak bagian terakhir dari path
              const parts = urlStr.split("/")
              endpoint = parts[parts.length - 1] || urlStr
            }

            // Log request start
            logAuthRequest({
              endpoint,
              method,
              source: "server",
              success: true,
              duration: 0,
              cached: false,
              details: { action: "start", url: urlStr },
            })

            const startTime = performance.now()

            return fetch(url, options)
              .then(async (response) => {
                const endTime = performance.now()
                const duration = endTime - startTime

                // Log response
                let userId = undefined

                // Coba ekstrak user ID jika ada
                if (response.ok) {
                  try {
                    const clonedResponse = response.clone()
                    const responseData = await clonedResponse.json()
                    userId = responseData?.user?.id || responseData?.session?.user?.id
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }

                logAuthRequest({
                  endpoint,
                  method,
                  source: "server",
                  success: response.ok,
                  duration,
                  cached: false,
                  userId,
                  error: !response.ok ? `HTTP ${response.status}` : undefined,
                  details: {
                    status: response.status,
                    url: urlStr,
                  },
                })

                return response
              })
              .catch((error) => {
                const endTime = performance.now()
                const duration = endTime - startTime

                // Log error
                logAuthRequest({
                  endpoint,
                  method,
                  source: "server",
                  success: false,
                  duration,
                  cached: false,
                  error: error instanceof Error ? error.message : "Unknown error",
                  details: {
                    error,
                    url: urlStr,
                  },
                })

                throw error
              })
          }

          // Lanjutkan dengan permintaan normal untuk non-auth
          return fetch(url, options)
        },
      },
    },
  })
}

// Fungsi helper untuk mendapatkan user terverifikasi
export const getVerifiedUser = async () => {
  const supabase = createClient()

  try {
    // Log getVerifiedUser start
    logAuthRequest({
      endpoint: "getVerifiedUser",
      method: "INTERNAL",
      source: "server",
      success: true,
      duration: 0,
      cached: false,
      details: { action: "start" },
    })

    const startTime = performance.now()

    // Cek session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    const sessionEndTime = performance.now()
    const sessionDuration = sessionEndTime - startTime

    if (sessionError) {
      // Log session error
      logAuthRequest({
        endpoint: "getVerifiedUser",
        method: "INTERNAL",
        source: "server",
        success: false,
        duration: sessionDuration,
        cached: false,
        error: sessionError.message,
        details: { error: sessionError, step: "getSession" },
      })

      // Jangan log error jika hanya "Auth session missing"
      if (sessionError.message !== "Auth session missing!") {
        console.error("Error getting session:", sessionError)
      }
      return { user: null, error: sessionError }
    }

    if (!session) {
      // Log no session
      logAuthRequest({
        endpoint: "getVerifiedUser",
        method: "INTERNAL",
        source: "server",
        success: false,
        duration: sessionDuration,
        cached: false,
        error: "No session",
        details: { step: "getSession" },
      })

      return { user: null, error: "No session" }
    }

    // Tambahkan pemeriksaan token
    if (!session.access_token) {
      // Log invalid token
      logAuthRequest({
        endpoint: "getVerifiedUser",
        method: "INTERNAL",
        source: "server",
        success: false,
        duration: sessionDuration,
        cached: false,
        error: "Invalid session: no access token",
        details: { step: "validateToken" },
      })

      return { user: null, error: "Invalid session: no access token" }
    }

    try {
      // Verifikasi user dengan getUser()
      const getUserStartTime = performance.now()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      const getUserEndTime = performance.now()
      const getUserDuration = getUserEndTime - getUserStartTime
      const totalDuration = getUserEndTime - startTime

      if (userError) {
        // Log user error
        logAuthRequest({
          endpoint: "getVerifiedUser",
          method: "INTERNAL",
          source: "server",
          success: false,
          duration: totalDuration,
          cached: false,
          error: userError.message,
          details: { error: userError, step: "getUser" },
        })

        // Jangan log error jika hanya "Auth session missing"
        if (userError.message !== "Auth session missing!") {
          console.error("Error verifying user:", userError)
        }
        return { user: null, error: userError }
      }

      if (!user) {
        // Log no user
        logAuthRequest({
          endpoint: "getVerifiedUser",
          method: "INTERNAL",
          source: "server",
          success: false,
          duration: totalDuration,
          cached: false,
          error: "User verification failed",
          details: { step: "getUser" },
        })

        return { user: null, error: "User verification failed" }
      }

      // Log success
      logAuthRequest({
        endpoint: "getVerifiedUser",
        method: "INTERNAL",
        source: "server",
        success: true,
        duration: totalDuration,
        cached: false,
        userId: user.id,
        details: { userId: user.id },
      })

      return { user, error: null }
    } catch (userError) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Log error
      logAuthRequest({
        endpoint: "getVerifiedUser",
        method: "INTERNAL",
        source: "server",
        success: false,
        duration,
        cached: false,
        error: userError instanceof Error ? userError.message : "Unknown error",
        details: { error: userError, step: "getUser" },
      })

      // Tangani error dengan lebih baik
      if (userError instanceof Error && userError.message.includes("Auth session missing")) {
        return { user: null, error: "Auth session missing" }
      }
      console.error("Unexpected error in getUser:", userError)
      return { user: null, error: "Unexpected error occurred" }
    }
  } catch (error) {
    // Log unexpected error
    logAuthRequest({
      endpoint: "getVerifiedUser",
      method: "INTERNAL",
      source: "server",
      success: false,
      duration: 0,
      cached: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: { error },
    })

    console.error("Unexpected error in getVerifiedUser:", error)
    return { user: null, error: "Unexpected error occurred" }
  }
}

// Fungsi helper untuk memeriksa apakah user adalah admin
export const isAdmin = async (userId: string) => {
  const supabase = createClient()

  // Log isAdmin check
  logAuthRequest({
    endpoint: "isAdmin",
    method: "INTERNAL",
    source: "server",
    success: true,
    duration: 0,
    cached: false,
    userId,
    details: { action: "start", userId },
  })

  const startTime = performance.now()

  try {
    const { data: userData, error } = await supabase.from("users").select("email").eq("id", userId).single()
    const endTime = performance.now()
    const duration = endTime - startTime

    if (error) {
      // Log error
      logAuthRequest({
        endpoint: "isAdmin",
        method: "INTERNAL",
        source: "server",
        success: false,
        duration,
        cached: false,
        userId,
        error: error.message,
        details: { error },
      })

      return false
    }

    const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda
    const isAdminUser = adminEmails.includes(userData?.email || "")

    // Log result
    logAuthRequest({
      endpoint: "isAdmin",
      method: "INTERNAL",
      source: "server",
      success: true,
      duration,
      cached: false,
      userId,
      details: { isAdmin: isAdminUser, email: userData?.email },
    })

    return isAdminUser
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime

    // Log error
    logAuthRequest({
      endpoint: "isAdmin",
      method: "INTERNAL",
      source: "server",
      success: false,
      duration,
      cached: false,
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      details: { error },
    })

    return false
  }
}
