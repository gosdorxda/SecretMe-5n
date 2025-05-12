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

// Tambahkan logging untuk fungsi getVerifiedUser
export async function getVerifiedUser() {
  const start = performance.now()
  let success = false
  let error = null

  try {
    const supabase = createServerComponentClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      error = sessionError
      return { user: null, error: sessionError }
    }

    if (!session?.user) {
      return { user: null, error: new Error("No user found in session") }
    }

    success = true
    return { user: session.user, error: null }
  } catch (err) {
    error = err
    return { user: null, error: err }
  } finally {
    // Log permintaan
    logAuthRequest({
      endpoint: "getVerifiedUser",
      method: "GET",
      source: "server",
      success,
      duration: performance.now() - start,
      cached: false,
      userId: success ? (await createServerComponentClient().auth.getSession()).data.session?.user?.id : undefined,
      error: error ? String(error) : undefined,
    })
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
