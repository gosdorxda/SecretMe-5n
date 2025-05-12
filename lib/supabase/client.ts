"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"
import { recordAuthRequest } from "@/lib/auth-monitor"

// Client-side Supabase client
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Tambahkan throttling untuk permintaan auth
const authRequestTimestamps: number[] = []
const AUTH_REQUEST_LIMIT = 10 // Maksimum 10 permintaan
const AUTH_REQUEST_WINDOW = 60000 // dalam jendela 1 menit (60000ms)

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
    // Periksa apakah ada sesi yang valid
    const { data: sessionData, error: sessionError } = await client.auth.getSession()

    if (sessionError) {
      console.error("❌ Error saat memeriksa sesi:", sessionError)
      return false
    }

    // Jika tidak ada sesi valid tetapi ada token di localStorage
    if (!sessionData?.session && typeof window !== "undefined") {
      console.log("🔄 Mencoba memperbaiki sesi dari localStorage...")

      // Coba ambil token dari localStorage
      const localStorageData = localStorage.getItem("supabase.auth.token")
      if (localStorageData) {
        try {
          const parsedData = JSON.parse(localStorageData)

          // Jika ada token di localStorage, coba set session secara manual
          if (parsedData?.currentSession?.access_token && parsedData?.currentSession?.refresh_token) {
            console.log("🔄 Token ditemukan di localStorage, mencoba set session...")

            const { error: setSessionError } = await client.auth.setSession({
              access_token: parsedData.currentSession.access_token,
              refresh_token: parsedData.currentSession.refresh_token,
            })

            if (setSessionError) {
              console.error("❌ Gagal memperbaiki sesi:", setSessionError.message)
              return false
            }

            // Verifikasi bahwa session berhasil diperbaiki
            const { data: verifyData, error: verifyError } = await client.auth.getUser()

            if (verifyError || !verifyData.user) {
              console.error("❌ Sesi diperbaiki tetapi verifikasi user gagal:", verifyError)
              return false
            }

            console.log("✅ Sesi berhasil diperbaiki dari localStorage")
            return true
          }
        } catch (e) {
          console.error("❌ Error parsing localStorage data:", e)
        }
      }
    }
  } catch (e) {
    console.error("❌ Error saat memeriksa sesi:", e)
  }

  return false
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
              const startTime = performance.now()
              const endpoint = url.toString().split("/").slice(-2).join("/")

              // Jika perlu throttle, tunda permintaan
              if (shouldThrottleAuthRequest()) {
                console.warn("🛑 Auth request throttled to prevent rate limiting")

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
                .then((response) => {
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

    // Tambahkan logging untuk getSession
    const originalGetSession = supabaseClient.auth.getSession
    supabaseClient.auth.getSession = async function () {
      console.log("🔍 CLIENT getSession dipanggil dari:", new Error().stack)
      return originalGetSession.apply(this, arguments)
    }

    // Tambahkan logging untuk getUser
    const originalGetUser = supabaseClient.auth.getUser
    supabaseClient.auth.getUser = async function () {
      console.log("🔍 CLIENT getUser dipanggil dari:", new Error().stack)
      return originalGetUser.apply(this, arguments)
    }

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
