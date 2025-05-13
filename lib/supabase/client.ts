"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"
import { logAuthRequest } from "@/lib/auth-logger"

// Client-side Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Throttling untuk permintaan auth
const authRequestTimestamps: number[] = []
const AUTH_REQUEST_LIMIT = 3 // Maksimum 3 permintaan
const AUTH_REQUEST_WINDOW = 60000 // dalam jendela 1 menit (60000ms)

// Debounce untuk mencegah multiple calls
let authDebounceTimer: NodeJS.Timeout | null = null
const AUTH_DEBOUNCE_DELAY = 2000 // 2 detik

// Flag untuk mencegah multiple refresh
let isRefreshingToken = false
let lastRefreshTime = 0
const MIN_REFRESH_INTERVAL = 300000 // 5 menit untuk semua perangkat

// Flag untuk mendeteksi error rate limit
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

    // Throttle refresh attempts
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
const AUTH_CACHE_TTL = 300000 // 5 menit

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
  return createClientComponentClient<Database>()
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

// Implementasi universal untuk signOut
export async function signOutWithLogging() {
  const start = performance.now()
  let success = false
  let error = null

  try {
    const supabase = createClient()

    // Log attempt
    logAuthRequest({
      endpoint: "signOut",
      method: "POST",
      source: "client",
      success: true,
      duration: 0,
      cached: false,
      details: { action: "start" },
    })

    // 1. Coba signOut standar
    const { error: signOutError } = await supabase.auth.signOut()

    // 2. Jika error, lakukan cleanup manual
    if (signOutError) {
      error = signOutError
      console.error("Error during signOut:", signOutError)

      // Log error
      logAuthRequest({
        endpoint: "signOut",
        method: "POST",
        source: "client",
        success: false,
        duration: performance.now() - start,
        cached: false,
        error: signOutError.message,
        details: { error: signOutError },
      })
    }

    // 3. Selalu lakukan cleanup manual untuk konsistensi
    if (typeof window !== "undefined") {
      // Hapus token dari localStorage
      localStorage.removeItem("supabase.auth.token")

      // Hapus semua item localStorage yang terkait Supabase
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("supabase.")) {
          localStorage.removeItem(key)
        }
      })

      // Hapus cookie secara manual
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      // Log manual cleanup
      logAuthRequest({
        endpoint: "signOut",
        method: "POST",
        source: "client",
        success: true,
        duration: performance.now() - start,
        cached: false,
        details: { action: "manualCleanup" },
      })
    }

    // Bersihkan cache
    sessionCache.clear()

    success = true
    return { error: null }
  } catch (err) {
    error = err
    return { error: err }
  } finally {
    // Log final result
    logAuthRequest({
      endpoint: "signOut",
      method: "POST",
      source: "client",
      success,
      duration: performance.now() - start,
      cached: false,
      error: error ? String(error) : undefined,
      details: { finalStatus: success ? "success" : "failed" },
    })
  }
}
