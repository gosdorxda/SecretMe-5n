"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"
import { recordAuthRequest } from "@/lib/auth-monitor"

// Client-side Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Tambahkan throttling untuk permintaan auth
const authRequestTimestamps: number[] = []
// Kurangi batas permintaan secara drastis
const AUTH_REQUEST_LIMIT = 3 // Maksimum 3 permintaan
const AUTH_REQUEST_WINDOW = 60000 // dalam jendela 1 menit (60000ms)

// Tambahkan debounce untuk mencegah multiple calls
let authDebounceTimer: NodeJS.Timeout | null = null
const AUTH_DEBOUNCE_DELAY = 2000 // 2 detik

// Tambahkan flag untuk mencegah multiple refresh
let isRefreshingToken = false
let lastRefreshTime = 0
const MIN_REFRESH_INTERVAL = 300000 // 5 menit

// Fungsi untuk memeriksa apakah kita perlu throttle permintaan auth
function shouldThrottleAuthRequest(): boolean {
  const now = Date.now()

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

    // Hindari refresh yang terlalu sering
    const now = Date.now()
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      return false
    }

    isRefreshingToken = true
    lastRefreshTime = now

    // Periksa apakah ada sesi yang valid
    const { data: sessionData, error: sessionError } = await client.auth.getSession()

    if (sessionError) {
      console.error("❌ Error saat memeriksa sesi:", sessionError)
      isRefreshingToken = false
      return false
    }

    // Jika tidak ada sesi valid tetapi ada token di localStorage
    if (!sessionData?.session && typeof window !== "undefined") {
      // Coba ambil token dari localStorage
      const localStorageData = localStorage.getItem("supabase.auth.token")
      if (localStorageData) {
        try {
          const parsedData = JSON.parse(localStorageData)

          // Jika ada token di localStorage, coba set session secara manual
          if (parsedData?.currentSession?.access_token && parsedData?.currentSession?.refresh_token) {
            const { error: setSessionError } = await client.auth.setSession({
              access_token: parsedData.currentSession.access_token,
              refresh_token: parsedData.currentSession.refresh_token,
            })

            if (setSessionError) {
              console.error("❌ Gagal memperbaiki sesi:", setSessionError.message)
              isRefreshingToken = false
              return false
            }

            // Verifikasi bahwa session berhasil diperbaiki
            const { data: verifyData, error: verifyError } = await client.auth.getUser()

            if (verifyError || !verifyData.user) {
              console.error("❌ Sesi diperbaiki tetapi verifikasi user gagal:", verifyError)
              isRefreshingToken = false
              return false
            }

            isRefreshingToken = false
            return true
          }
        } catch (e) {
          console.error("❌ Error parsing localStorage data:", e)
        }
      }
    }

    isRefreshingToken = false
    return false
  } catch (e) {
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
const AUTH_CACHE_TTL = 300000 // 5 menit (dari 1 menit)

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
            lifetime: 60 * 60 * 8,
            domain: "",
            path: "/",
            sameSite: "lax", // Ubah ke "none" jika menggunakan domain yang berbeda
            secure: true, // Harus true untuk produksi dan jika sameSite adalah "none"
          },
          // Add error handling for token refresh
          onAuthStateChange: (event, session) => {
            if (event === "TOKEN_REFRESHED_FAILED") {
              // Handle failed token refresh by clearing local storage
              localStorage.removeItem("supabase.auth.token")
              console.error("Token refresh failed. Local storage cleared.")
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

            if (isAuthRequest) {
              const urlStr = url.toString()
              const cacheKey = `${urlStr}-${JSON.stringify(options?.body || {})}`

              // Cek cache untuk request yang sama
              const cachedResponse = authRequestCache.get(cacheKey)
              if (cachedResponse && Date.now() - cachedResponse.timestamp < AUTH_CACHE_TTL) {
                return Promise.resolve(
                  new Response(JSON.stringify(cachedResponse.data), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                  }),
                )
              }

              // Debounce auth requests untuk mengurangi multiple calls
              if (urlStr.includes("/token?grant_type=refresh_token")) {
                return debounceAuthRequest(async () => {
                  // Jika sudah refreshing, return cached response atau error
                  if (isRefreshingToken) {
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

                  isRefreshingToken = true
                  lastRefreshTime = now

                  try {
                    const response = await fetch(url, options)
                    isRefreshingToken = false
                    return response
                  } catch (error) {
                    isRefreshingToken = false
                    throw error
                  }
                })
              }

              const startTime = performance.now()
              const endpoint = urlStr.split("/").slice(-2).join("/")

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

                  // Cache response jika sukses
                  if (response.ok) {
                    const clonedResponse = response.clone()
                    const responseData = await clonedResponse.json()
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
  supabaseClient = null
}

// Fungsi untuk memperbaiki sesi secara manual
export const repairSession = async () => {
  const client = createClient()
  return await repairSessionIfNeeded(client)
}
