"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"
import { recordAuthRequest } from "@/lib/auth-monitor"
import { logAuthRequest } from "@/lib/auth-logger"

// Client-side Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Tambahkan throttling untuk permintaan auth
const authRequestTimestamps: number[] = []
// Kurangi batas permintaan secara drastis
const AUTH_REQUEST_LIMIT = 2 // Maksimum 2 permintaan
const AUTH_REQUEST_WINDOW = 60000 // dalam jendela 1 menit (60000ms)

// Tambahkan debounce untuk mencegah multiple calls
let authDebounceTimer: NodeJS.Timeout | null = null
const AUTH_DEBOUNCE_DELAY = 2000 // 2 detik

// Tambahkan flag untuk mencegah multiple refresh
let isRefreshingToken = false
let lastRefreshTime = 0
const MIN_REFRESH_INTERVAL = 600000 // 10 menit

// Tambahkan flag untuk mendeteksi error rate limit
let hasHitRateLimit = false
let rateLimitResetTime = 0
const RATE_LIMIT_BACKOFF = 600000 // 10 menit

// Simple session cache
const sessionCache = {
  cache: null as any,
  set: (data: any) => {
    sessionCache.cache = data
  },
  get: () => {
    return sessionCache.cache
  },
  has: () => {
    return !!sessionCache.cache
  },
  clear: () => {
    sessionCache.cache = null
  },
}

// Fungsi untuk memeriksa apakah kita perlu throttle permintaan auth
function shouldThrottleAuthRequest(): boolean {
  const now = Date.now()

  // Jika sudah pernah hit rate limit, throttle lebih agresif
  if (hasHitRateLimit && now < rateLimitResetTime) {
    return true
  }

  // Hapus timestamp yang lebih lama dari jendela waktu
  while (authRequestTimestamps.length > 0 && authRequestTimestamps[0] < now - AUTH_REQUEST_WINDOW) {
    authRequestTimestamps.shift()
  }

  // Jika jumlah permintaan dalam jendela waktu melebihi batas, throttle
  return authRequestTimestamps.length >= AUTH_REQUEST_LIMIT
}

// Fungsi untuk mencatat permintaan auth baru
function recordAuthRequestTimestamp() {
  authRequestTimestamps.push(Date.now())
}

// Fungsi untuk memeriksa dan memperbaiki token dari localStorage jika cookie bermasalah
async function repairSessionIfNeeded(client: ReturnType<typeof createClientComponentClient<Database>>) {
  try {
    // Hindari multiple repair attempts
    if (isRefreshingToken) {
      return false
    }

    // Kurangi throttling untuk mobile
    const now = Date.now()
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL / 2) {
      return false
    }

    isRefreshingToken = true
    lastRefreshTime = now

    const startTime = performance.now()

    // Log permintaan
    logAuthRequest({
      endpoint: "repairSession",
      method: "GET",
      source: "client",
      success: true,
      duration: 0,
      cached: false,
      details: {
        action: "start",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        isMobile:
          typeof navigator !== "undefined"
            ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            : false,
      },
    })

    // Periksa apakah ada sesi yang valid
    const { data: sessionData, error: sessionError } = await client.auth.getSession()

    const endTime = performance.now()
    const duration = endTime - startTime

    if (sessionError) {
      // Log error
      logAuthRequest({
        endpoint: "repairSession",
        method: "GET",
        source: "client",
        success: false,
        duration,
        cached: false,
        error: sessionError.message,
        details: {
          error: sessionError,
          errorCode: sessionError.code,
          errorStatus: sessionError.status,
        },
      })

      console.error("❌ Error saat memeriksa sesi:", sessionError)

      // Jika error adalah rate limit, set flag
      if (sessionError.status === 429) {
        hasHitRateLimit = true
        rateLimitResetTime = Date.now() + RATE_LIMIT_BACKOFF
        console.warn(`Rate limit hit, backing off for ${RATE_LIMIT_BACKOFF / 60000} minutes`)
      }

      isRefreshingToken = false
      return false
    }

    // Log hasil
    logAuthRequest({
      endpoint: "getSession",
      method: "GET",
      source: "client",
      success: true,
      duration,
      cached: false,
      userId: sessionData?.session?.user?.id,
      details: {
        hasSession: !!sessionData?.session,
        sessionExpiry: sessionData?.session?.expires_at
          ? new Date(sessionData.session.expires_at * 1000).toISOString()
          : null,
      },
    })

    // Jika tidak ada sesi valid tetapi ada token di localStorage
    if (!sessionData?.session && typeof window !== "undefined") {
      // Coba ambil token dari localStorage
      const localStorageData = localStorage.getItem("supabase.auth.token")
      if (localStorageData) {
        try {
          const parsedData = JSON.parse(localStorageData)

          // Jika ada token di localStorage, coba set session secara manual
          if (parsedData?.currentSession?.access_token && parsedData?.currentSession?.refresh_token) {
            logAuthRequest({
              endpoint: "setSession",
              method: "POST",
              source: "client",
              success: true,
              duration: 0,
              cached: false,
              details: { action: "start" },
            })

            const setSessionStartTime = performance.now()
            const { error: setSessionError } = await client.auth.setSession({
              access_token: parsedData.currentSession.access_token,
              refresh_token: parsedData.currentSession.refresh_token,
            })
            const setSessionEndTime = performance.now()
            const setSessionDuration = setSessionEndTime - setSessionStartTime

            if (setSessionError) {
              // Log error
              logAuthRequest({
                endpoint: "setSession",
                method: "POST",
                source: "client",
                success: false,
                duration: setSessionDuration,
                cached: false,
                error: setSessionError.message,
                details: { error: setSessionError },
              })

              console.error("❌ Gagal memperbaiki sesi:", setSessionError.message)

              // Jika error adalah invalid refresh token, hapus token dari localStorage
              if (
                setSessionError.message.includes("Invalid Refresh Token") ||
                setSessionError.message.includes("refresh_token_not_found")
              ) {
                localStorage.removeItem("supabase.auth.token")
                console.warn("Invalid refresh token detected, cleared localStorage")
              }

              // Jika error adalah rate limit, set flag
              if (setSessionError.status === 429) {
                hasHitRateLimit = true
                rateLimitResetTime = Date.now() + RATE_LIMIT_BACKOFF
                console.warn(`Rate limit hit, backing off for ${RATE_LIMIT_BACKOFF / 60000} minutes`)
              }

              isRefreshingToken = false
              return false
            }

            // Log sukses
            logAuthRequest({
              endpoint: "setSession",
              method: "POST",
              source: "client",
              success: true,
              duration: setSessionDuration,
              cached: false,
              details: { action: "success" },
            })

            // Verifikasi bahwa session berhasil diperbaiki
            logAuthRequest({
              endpoint: "getUser",
              method: "GET",
              source: "client",
              success: true,
              duration: 0,
              cached: false,
              details: { action: "start" },
            })

            const getUserStartTime = performance.now()
            const { data: verifyData, error: verifyError } = await client.auth.getUser()
            const getUserEndTime = performance.now()
            const getUserDuration = getUserEndTime - getUserStartTime

            if (verifyError || !verifyData.user) {
              // Log error
              logAuthRequest({
                endpoint: "getUser",
                method: "GET",
                source: "client",
                success: false,
                duration: getUserDuration,
                cached: false,
                error: verifyError?.message || "No user data",
                details: { error: verifyError },
              })

              console.error("❌ Sesi diperbaiki tetapi verifikasi user gagal:", verifyError)
              isRefreshingToken = false
              return false
            }

            // Log sukses
            logAuthRequest({
              endpoint: "getUser",
              method: "GET",
              source: "client",
              success: true,
              duration: getUserDuration,
              cached: false,
              userId: verifyData.user.id,
              details: { user: verifyData.user.id },
            })

            isRefreshingToken = false
            return true
          }
        } catch (e) {
          // Log error
          logAuthRequest({
            endpoint: "repairSession",
            method: "GET",
            source: "client",
            success: false,
            duration,
            cached: false,
            error: e instanceof Error ? e.message : "Unknown error",
            details: { error: e },
          })

          console.error("❌ Error parsing localStorage data:", e)
        }
      }
    }

    isRefreshingToken = false
    return !!sessionData?.session
  } catch (e) {
    // Log error
    logAuthRequest({
      endpoint: "repairSession",
      method: "GET",
      source: "client",
      success: false,
      duration: 0,
      cached: false,
      error: e instanceof Error ? e.message : "Unknown error",
      details: { error: e },
    })

    console.error("❌ Error saat memeriksa sesi:", e)
    isRefreshingToken = false
    return false
  }
}

// Menekan peringatan Supabase tentang getSession
const originalConsoleWarn = console.warn
if (typeof console !== "undefined" && console.warn) {
  console.warn = function (message, ...args) {
    // Menekan peringatan spesifik dari Supabase
    if (
      typeof message === "string" &&
      (message.includes("Using the user object as returned from supabase.auth.getSession()") ||
        message.includes("RATE LIMIT WARNING"))
    ) {
      return
    }
    originalConsoleWarn.apply(this, [message, ...args])
  }
}

// Cache untuk menyimpan hasil auth requests
const authRequestCache = new Map<string, { data: any; timestamp: number }>()
const AUTH_CACHE_TTL = 600000 // 10 menit (dari 5 menit)

// Fungsi debounce untuk auth requests
function debounceAuthRequest(fn: Function): Promise<any> {
  return new Promise((resolve) => {
    if (authDebounceTimer) {
      clearTimeout(authDebounceTimer)
    }

    authDebounceTimer = setTimeout(() => {
      resolve(fn())
    }, AUTH_DEBOUNCE_DELAY)
  })
}

// Fungsi untuk menangani error rate limit
function handleRateLimitError(error: any) {
  if (error?.status === 429 || (error?.message && error.message.includes("rate limit"))) {
    hasHitRateLimit = true
    rateLimitResetTime = Date.now() + RATE_LIMIT_BACKOFF
    console.warn(`Rate limit hit, backing off for ${RATE_LIMIT_BACKOFF / 60000} minutes`)

    // Hapus token yang mungkin bermasalah
    if (typeof window !== "undefined") {
      localStorage.removeItem("supabase.auth.token")
    }

    return true
  }
  return false
}

// Fungsi untuk mendapatkan nama endpoint dari URL
function getEndpointName(url: string): string {
  if (url.includes("/auth/v1/token")) return "refreshToken"
  if (url.includes("/auth/v1/logout")) return "signOut"
  if (url.includes("/auth/v1/user")) return "getUser"
  if (url.includes("/auth/v1/session")) return "getSession"

  // Ekstrak bagian terakhir dari path
  const parts = url.split("/")
  return parts[parts.length - 1] || url
}

export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "supabase.auth.token",
          cookieOptions: {
            name: "sb-auth-token",
            lifetime: 60 * 60 * 24 * 7, // Perpanjang lifetime menjadi 7 hari
            domain: process.env.COOKIE_DOMAIN || "",
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          },
          // Add error handling for token refresh
          onAuthStateChange: (event, session) => {
            // Log auth state change
            logAuthRequest({
              endpoint: "authStateChange",
              method: "EVENT",
              source: "client",
              success: true,
              duration: 0,
              cached: false,
              userId: session?.user?.id,
              details: { event, hasSession: !!session },
            })

            if (event === "TOKEN_REFRESHED_FAILED") {
              // Handle failed token refresh by clearing local storage
              localStorage.removeItem("supabase.auth.token")
              console.error("Token refresh failed. Local storage cleared.")

              // Log token refresh failure
              logAuthRequest({
                endpoint: "tokenRefresh",
                method: "EVENT",
                source: "client",
                success: false,
                duration: 0,
                cached: false,
                error: "TOKEN_REFRESHED_FAILED",
                details: { event },
              })
            }

            if (event === "TOKEN_REFRESHED") {
              // Log token refresh success
              logAuthRequest({
                endpoint: "tokenRefresh",
                method: "EVENT",
                source: "client",
                success: true,
                duration: 0,
                cached: false,
                userId: session?.user?.id,
                details: { event },
              })
            }
          },
        },
        global: {
          // Tambahkan interceptor untuk throttling permintaan auth dan monitoring
          fetch: (url, options) => {
            // Periksa apakah ini adalah permintaan auth
            const isAuthRequest =
              url.toString().includes("/auth/") ||
              (options?.headers && (options.headers as any)["X-Client-Info"]?.includes("supabase-js"))

            // Jika sudah hit rate limit, throttle semua permintaan auth
            if (isAuthRequest && hasHitRateLimit && Date.now() < rateLimitResetTime) {
              console.warn("Auth request throttled due to previous rate limit")

              // Log throttled request
              const endpoint = getEndpointName(url.toString())
              logAuthRequest({
                endpoint,
                method: options?.method || "GET",
                source: "client",
                success: false,
                duration: 0,
                cached: true,
                error: "Rate limit backoff in progress",
                details: { url: url.toString(), rateLimitReset: new Date(rateLimitResetTime).toISOString() },
              })

              return Promise.resolve(
                new Response(
                  JSON.stringify({
                    error: "Rate limit backoff in progress",
                    data: { session: null, user: null },
                  }),
                  {
                    status: 429,
                    headers: { "Content-Type": "application/json" },
                  },
                ),
              )
            }

            // Khusus untuk logout, jangan throttle dan pastikan respons valid
            const isLogoutRequest =
              url.toString().includes("/logout") ||
              (options?.method === "POST" && url.toString().includes("/auth/v1/logout"))

            if (isLogoutRequest) {
              // Log logout request
              logAuthRequest({
                endpoint: "signOut",
                method: "POST",
                source: "client",
                success: true,
                duration: 0,
                cached: false,
                details: { action: "start" },
              })

              const startTime = performance.now()

              // Untuk logout, selalu berikan respons valid
              return fetch(url, options)
                .then(async (response) => {
                  const endTime = performance.now()
                  const duration = endTime - startTime

                  // Log logout response
                  logAuthRequest({
                    endpoint: "signOut",
                    method: "POST",
                    source: "client",
                    success: response.ok,
                    duration,
                    cached: false,
                    details: { status: response.status },
                  })

                  // Jika respons kosong atau tidak valid, berikan respons default
                  if (!response.ok || response.status === 204) {
                    return new Response(JSON.stringify({ error: null }), {
                      status: 200,
                      headers: { "Content-Type": "application/json" },
                    })
                  }

                  try {
                    // Coba parse respons untuk memastikan valid
                    const clone = response.clone()
                    await clone.json()
                    return response
                  } catch (e) {
                    // Jika parsing gagal, berikan respons default
                    console.warn("Invalid JSON in logout response, providing default")

                    // Log parsing error
                    logAuthRequest({
                      endpoint: "signOut",
                      method: "POST",
                      source: "client",
                      success: true, // Tetap anggap sukses
                      duration,
                      cached: false,
                      error: "Invalid JSON response",
                      details: { error: e },
                    })

                    return new Response(JSON.stringify({ error: null }), {
                      status: 200,
                      headers: { "Content-Type": "application/json" },
                    })
                  }
                })
                .catch((error) => {
                  const endTime = performance.now()
                  const duration = endTime - startTime

                  // Log error
                  logAuthRequest({
                    endpoint: "signOut",
                    method: "POST",
                    source: "client",
                    success: false,
                    duration,
                    cached: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                    details: { error },
                  })

                  console.error("Error during logout:", error)
                  // Berikan respons default untuk mencegah error
                  return new Response(JSON.stringify({ error: null }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                  })
                })
            }

            if (isAuthRequest) {
              const urlStr = url.toString()
              const endpoint = getEndpointName(urlStr)
              const method = options?.method || "GET"
              const cacheKey = `${urlStr}-${JSON.stringify(options?.body || {})}`

              // Cek cache untuk request yang sama
              const cachedResponse = authRequestCache.get(cacheKey)
              if (cachedResponse && Date.now() - cachedResponse.timestamp < AUTH_CACHE_TTL) {
                // Log cached request
                logAuthRequest({
                  endpoint,
                  method,
                  source: "client",
                  success: true,
                  duration: 0,
                  cached: true,
                  userId: cachedResponse.data?.user?.id || cachedResponse.data?.session?.user?.id,
                  details: { fromCache: true, url: urlStr },
                })

                return Promise.resolve(
                  new Response(JSON.stringify(cachedResponse.data), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                  }),
                )
              }

              // Khusus untuk permintaan refresh token
              if (urlStr.includes("/token?grant_type=refresh_token")) {
                return debounceAuthRequest(async () => {
                  // Log refresh token request
                  logAuthRequest({
                    endpoint: "refreshToken",
                    method: "POST",
                    source: "client",
                    success: true,
                    duration: 0,
                    cached: false,
                    details: { action: "start", debounced: true },
                  })

                  // Jika sudah refreshing, return cached response atau error
                  if (isRefreshingToken) {
                    // Log throttled refresh
                    logAuthRequest({
                      endpoint: "refreshToken",
                      method: "POST",
                      source: "client",
                      success: false,
                      duration: 0,
                      cached: true,
                      error: "Token refresh in progress",
                      details: { throttled: true },
                    })

                    return new Response(
                      JSON.stringify({
                        error: "Token refresh in progress",
                        data: { session: null, user: null },
                      }),
                      {
                        status: 429,
                        headers: { "Content-Type": "application/json" },
                      },
                    )
                  }

                  // Jika refresh terlalu sering, throttle
                  const now = Date.now()
                  if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
                    // Log throttled refresh
                    logAuthRequest({
                      endpoint: "refreshToken",
                      method: "POST",
                      source: "client",
                      success: false,
                      duration: 0,
                      cached: true,
                      error: "Token refresh too frequent",
                      details: {
                        throttled: true,
                        lastRefresh: new Date(lastRefreshTime).toISOString(),
                        nextAllowed: new Date(lastRefreshTime + MIN_REFRESH_INTERVAL).toISOString(),
                      },
                    })

                    return new Response(
                      JSON.stringify({
                        error: "Token refresh too frequent",
                        data: { session: null, user: null },
                      }),
                      {
                        status: 429,
                        headers: { "Content-Type": "application/json" },
                      },
                    )
                  }

                  // Periksa body untuk refresh token
                  let refreshToken = null
                  if (options?.body && typeof options.body === "string") {
                    try {
                      const bodyData = JSON.parse(options.body)
                      refreshToken = bodyData.refresh_token
                    } catch (e) {
                      // Ignore parsing errors
                    }
                  }

                  // Jika tidak ada refresh token atau kosong, return error
                  if (!refreshToken) {
                    console.warn("Refresh token missing in request, aborting")

                    // Log missing token
                    logAuthRequest({
                      endpoint: "refreshToken",
                      method: "POST",
                      source: "client",
                      success: false,
                      duration: 0,
                      cached: false,
                      error: "Refresh token is missing",
                      details: { missingToken: true },
                    })

                    // Hapus token dari localStorage
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("supabase.auth.token")
                    }
                    return new Response(
                      JSON.stringify({
                        error: "Invalid refresh token",
                        error_description: "Refresh token is missing",
                      }),
                      {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                      },
                    )
                  }

                  isRefreshingToken = true
                  lastRefreshTime = now

                  const startTime = performance.now()

                  try {
                    const response = await fetch(url, options)
                    const endTime = performance.now()
                    const duration = endTime - startTime

                    // Periksa apakah respons adalah error
                    if (!response.ok) {
                      const errorData = await response.json()

                      // Log error response
                      logAuthRequest({
                        endpoint: "refreshToken",
                        method: "POST",
                        source: "client",
                        success: false,
                        duration,
                        cached: false,
                        error: errorData.error || errorData.error_description || "Unknown error",
                        details: {
                          status: response.status,
                          error: errorData,
                        },
                      })

                      // Jika error adalah invalid refresh token, hapus token dari localStorage
                      if (
                        errorData.error === "invalid_grant" ||
                        errorData.code === "refresh_token_not_found" ||
                        (errorData.error_description &&
                          (errorData.error_description.includes("Invalid Refresh Token") ||
                            errorData.error_description.includes("refresh token not found")))
                      ) {
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("supabase.auth.token")
                          console.warn("Invalid refresh token detected, cleared localStorage")
                        }
                      }

                      // Jika error adalah rate limit, set flag
                      if (response.status === 429 || errorData.code === "over_request_rate_limit") {
                        hasHitRateLimit = true
                        rateLimitResetTime = Date.now() + RATE_LIMIT_BACKOFF
                        console.warn(`Rate limit hit, backing off for ${RATE_LIMIT_BACKOFF / 60000} minutes`)
                      }
                    } else {
                      // Log successful refresh
                      try {
                        const responseData = await response.clone().json()
                        logAuthRequest({
                          endpoint: "refreshToken",
                          method: "POST",
                          source: "client",
                          success: true,
                          duration,
                          cached: false,
                          userId: responseData?.user?.id,
                          details: {
                            status: response.status,
                            hasUser: !!responseData?.user,
                          },
                        })
                      } catch (e) {
                        // Jika gagal parse JSON, tetap log sukses
                        logAuthRequest({
                          endpoint: "refreshToken",
                          method: "POST",
                          source: "client",
                          success: true,
                          duration,
                          cached: false,
                          details: {
                            status: response.status,
                            parseError: true,
                          },
                        })
                      }
                    }

                    isRefreshingToken = false
                    return response
                  } catch (error) {
                    const endTime = performance.now()
                    const duration = endTime - startTime

                    // Log error
                    logAuthRequest({
                      endpoint: "refreshToken",
                      method: "POST",
                      source: "client",
                      success: false,
                      duration,
                      cached: false,
                      error: error instanceof Error ? error.message : "Unknown error",
                      details: { error },
                    })

                    isRefreshingToken = false

                    // Periksa apakah error adalah rate limit
                    handleRateLimitError(error)

                    throw error
                  }
                })
              }

              const startTime = performance.now()

              // Jika perlu throttle, tunda permintaan
              if (shouldThrottleAuthRequest()) {
                // Catat permintaan yang di-throttle
                recordAuthRequest({
                  endpoint,
                  success: false,
                  duration: 0,
                  source: "client",
                  cached: true,
                })

                // Log throttled request
                logAuthRequest({
                  endpoint,
                  method,
                  source: "client",
                  success: false,
                  duration: 0,
                  cached: true,
                  error: "Request throttled",
                  details: {
                    throttled: true,
                    url: urlStr,
                    requestsInWindow: authRequestTimestamps.length,
                    windowSize: AUTH_REQUEST_WINDOW,
                    limit: AUTH_REQUEST_LIMIT,
                  },
                })

                // Kembalikan respons kosong untuk mencegah error
                return Promise.resolve(
                  new Response(
                    JSON.stringify({
                      error: null,
                      data: { session: null, user: null },
                    }),
                    {
                      status: 200,
                      headers: { "Content-Type": "application/json" },
                    },
                  ),
                )
              }

              // Catat permintaan auth baru
              recordAuthRequestTimestamp()

              // Log request start
              logAuthRequest({
                endpoint,
                method,
                source: "client",
                success: true,
                duration: 0,
                cached: false,
                details: { action: "start", url: urlStr },
              })

              // Lanjutkan dengan permintaan normal
              return fetch(url, options)
                .then(async (response) => {
                  const endTime = performance.now()
                  const duration = endTime - startTime

                  // Catat statistik permintaan
                  recordAuthRequest({
                    endpoint,
                    success: response.ok,
                    duration,
                    source: "client",
                    cached: false,
                  })

                  // Log response
                  let userId = undefined
                  let responseData = undefined

                  // Coba ekstrak user ID jika ada
                  if (response.ok) {
                    try {
                      const clonedResponse = response.clone()
                      responseData = await clonedResponse.json()
                      userId = responseData?.user?.id || responseData?.session?.user?.id
                    } catch (e) {
                      // Ignore parsing errors
                    }
                  }

                  logAuthRequest({
                    endpoint,
                    method,
                    source: "client",
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

                  // Periksa apakah respons adalah error rate limit
                  if (response.status === 429) {
                    hasHitRateLimit = true
                    rateLimitResetTime = Date.now() + RATE_LIMIT_BACKOFF
                    console.warn(`Rate limit hit, backing off for ${RATE_LIMIT_BACKOFF / 60000} minutes`)

                    // Hapus token yang mungkin bermasalah
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("supabase.auth.token")
                    }
                  }

                  // Cache response jika sukses
                  if (response.ok && responseData) {
                    authRequestCache.set(cacheKey, {
                      data: responseData,
                      timestamp: Date.now(),
                    })
                  }

                  return response
                })
                .catch((error) => {
                  const endTime = performance.now()
                  const duration = endTime - startTime

                  // Catat statistik permintaan gagal
                  recordAuthRequest({
                    endpoint,
                    success: false,
                    duration,
                    source: "client",
                    cached: false,
                  })

                  // Log error
                  logAuthRequest({
                    endpoint,
                    method,
                    source: "client",
                    success: false,
                    duration,
                    cached: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                    details: {
                      error,
                      url: urlStr,
                    },
                  })

                  // Periksa apakah error adalah rate limit
                  handleRateLimitError(error)

                  throw error
                })
            }

            // Lanjutkan dengan permintaan normal untuk non-auth
            return fetch(url, options)
          },
        },
      },
    })

    // Coba perbaiki sesi jika diperlukan
    repairSessionIfNeeded(supabaseClient)
  }
  return supabaseClient
}

// Function to reset the client (useful for handling auth errors)
export const resetClient = () => {
  // Log reset client
  logAuthRequest({
    endpoint: "resetClient",
    method: "INTERNAL",
    source: "client",
    success: true,
    duration: 0,
    cached: false,
    details: { action: "reset" },
  })

  supabaseClient = null

  // Reset flags
  isRefreshingToken = false
  hasHitRateLimit = false

  // Clear caches
  authRequestCache.clear()
  authRequestTimestamps.length = 0
}

// Fungsi untuk memperbaiki sesi secara manual
export const repairSession = async () => {
  // Log repair session
  logAuthRequest({
    endpoint: "repairSession",
    method: "INTERNAL",
    source: "client",
    success: true,
    duration: 0,
    cached: false,
    details: { action: "manual" },
  })

  const client = createClient()
  return await repairSessionIfNeeded(client)
}

// Fungsi untuk menangani invalid refresh token
export const handleInvalidRefreshToken = () => {
  // Log invalid refresh token
  logAuthRequest({
    endpoint: "handleInvalidRefreshToken",
    method: "INTERNAL",
    source: "client",
    success: true,
    duration: 0,
    cached: false,
    details: { action: "cleanup" },
  })

  if (typeof window !== "undefined") {
    localStorage.removeItem("supabase.auth.token")
  }
  resetClient()
}

// Tambahkan logging untuk fungsi getSession
export async function getSessionWithLogging() {
  const start = performance.now()
  let success = false
  let error = null
  let cached = false

  try {
    // Cek apakah ada sesi yang di-cache
    if (sessionCache.has()) {
      const cachedSession = sessionCache.get()
      success = true
      cached = true

      // Log permintaan yang di-cache
      logAuthRequest({
        endpoint: "getSession",
        method: "GET",
        source: "client",
        success: true,
        duration: performance.now() - start,
        cached: true,
        userId: cachedSession?.user?.id,
      })

      return cachedSession
    }

    const supabase = createClient()
    const { data, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      error = sessionError
      throw sessionError
    }

    // Cache sesi jika valid
    if (data?.session) {
      sessionCache.set(data)
    }

    success = true
    return data
  } catch (err) {
    error = err
    throw err
  } finally {
    // Log permintaan
    logAuthRequest({
      endpoint: "getSession",
      method: "GET",
      source: "client",
      success,
      duration: performance.now() - start,
      cached,
      userId: success ? sessionCache.get()?.session?.user?.id : undefined,
      error: error ? String(error) : undefined,
    })
  }
}

// Tambahkan logging untuk fungsi getUser
export async function getUserWithLogging() {
  const start = performance.now()
  let success = false
  let error = null
  let cached = false

  try {
    // Cek apakah ada sesi yang di-cache
    if (sessionCache.has()) {
      const cachedSession = sessionCache.get()
      if (cachedSession?.session?.user) {
        success = true
        cached = true

        // Log permintaan yang di-cache
        logAuthRequest({
          endpoint: "getUser",
          method: "GET",
          source: "client",
          success: true,
          duration: performance.now() - start,
          cached: true,
          userId: cachedSession.session.user.id,
        })

        return { user: cachedSession.session.user, error: null }
      }
    }

    const { session, error: sessionError } = await getSessionWithLogging()

    if (sessionError) {
      error = sessionError
      return { user: null, error: sessionError }
    }

    success = true
    return { user: session?.user || null, error: null }
  } catch (err) {
    error = err
    return { user: null, error: err }
  } finally {
    // Log permintaan
    logAuthRequest({
      endpoint: "getUser",
      method: "GET",
      source: "client",
      success,
      duration: performance.now() - start,
      cached,
      userId: success ? sessionCache.get()?.session?.user?.id : undefined,
      error: error ? String(error) : undefined,
    })
  }
}

// Tambahkan logging untuk fungsi signOut
export async function signOutWithLogging() {
  const start = performance.now()
  let success = false
  let error = null

  try {
    const supabase = createClient()
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      error = signOutError
      throw signOutError
    }

    // Bersihkan cache
    sessionCache.clear()

    success = true
    return { error: null }
  } catch (err) {
    error = err
    return { error: err }
  } finally {
    // Log permintaan
    logAuthRequest({
      endpoint: "signOut",
      method: "POST",
      source: "client",
      success,
      duration: performance.now() - start,
      cached: false,
      error: error ? String(error) : undefined,
    })
  }
}
