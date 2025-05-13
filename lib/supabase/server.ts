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
  try {
    const cookieStore = cookies()
    return createServerComponentClient<Database>({
      cookies: () => cookieStore,
    })
  } catch (error) {
    // Log error saat membuat client
    logAuthRequest({
      endpoint: "createClient",
      method: "INTERNAL",
      source: "server",
      success: false,
      duration: 0,
      cached: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: { error },
    })

    // Fallback ke client tanpa cookies untuk mencegah crash
    console.error("Error creating Supabase client:", error)

    // Return dummy client yang akan mengembalikan null untuk auth operations
    // dan mengimplementasikan semua method yang dibutuhkan
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: (table: string) => ({
        select: (columns: string) => ({
          eq: (column: string, value: any) => ({
            single: async () => ({ data: null, error: null }),
          }),
          order: (column: string, options: any) => ({
            data: [],
            error: null,
          }),
        }),
        order: (column: string, options: any) => ({
          data: [],
          error: null,
        }),
      }),
    } as any
  }
}

// Tambahkan logging untuk fungsi getVerifiedUser
export async function getVerifiedUser() {
  const start = performance.now()
  let success = false
  let error = null
  let userId = null
  let sessionData = null

  try {
    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      logAuthRequest({
        endpoint: "getVerifiedUser",
        method: "GET",
        source: "server",
        success: false,
        duration: performance.now() - start,
        cached: false,
        error: err instanceof Error ? err.message : "Error creating client",
        details: { error: err },
      })
      return { user: null, error: err }
    }

    // Log permintaan getSession
    logAuthRequest({
      endpoint: "getVerifiedUser/getSession",
      method: "GET",
      source: "server",
      success: true,
      duration: 0,
      cached: false,
      details: { action: "start" },
    })

    const sessionStart = performance.now()
    const { data, error: sessionError } = await supabase.auth.getSession()
    const sessionDuration = performance.now() - sessionStart

    sessionData = data

    // Log hasil getSession
    logAuthRequest({
      endpoint: "getVerifiedUser/getSession",
      method: "GET",
      source: "server",
      success: !sessionError,
      duration: sessionDuration,
      cached: false,
      userId: data?.session?.user?.id,
      error: sessionError ? sessionError.message : undefined,
      details: {
        hasSession: !!data?.session,
        sessionError: sessionError ? true : false,
        sessionErrorMessage: sessionError?.message,
      },
    })

    if (sessionError) {
      error = sessionError
      return { user: null, error: sessionError }
    }

    if (!data?.session?.user) {
      error = new Error("No user found in session")

      // Log error detail
      logAuthRequest({
        endpoint: "getVerifiedUser/noUser",
        method: "GET",
        source: "server",
        success: false,
        duration: performance.now() - start,
        cached: false,
        error: "No user found in session",
        details: {
          sessionExists: !!data?.session,
          sessionData: data?.session ? JSON.stringify(data.session).substring(0, 100) + "..." : null,
        },
      })

      return { user: null, error }
    }

    // Jika kita sampai di sini, kita memiliki user
    userId = data.session.user.id
    success = true

    // Verifikasi user dengan getUser untuk memastikan token valid
    try {
      const userStart = performance.now()
      const { data: userData, error: userError } = await supabase.auth.getUser()
      const userDuration = performance.now() - userStart

      // Log hasil getUser
      logAuthRequest({
        endpoint: "getVerifiedUser/getUser",
        method: "GET",
        source: "server",
        success: !userError,
        duration: userDuration,
        cached: false,
        userId: userData?.user?.id,
        error: userError ? userError.message : undefined,
        details: {
          hasUser: !!userData?.user,
          userMatchesSession: userData?.user?.id === userId,
        },
      })

      if (userError || !userData.user) {
        return { user: null, error: userError || new Error("User verification failed") }
      }

      // Pastikan user dari getUser cocok dengan user dari getSession
      if (userData.user.id !== userId) {
        return { user: null, error: new Error("User ID mismatch between session and verification") }
      }

      // User terverifikasi, gunakan data dari getUser
      return { user: userData.user, error: null }
    } catch (verifyError) {
      // Log error verifikasi
      logAuthRequest({
        endpoint: "getVerifiedUser/verifyError",
        method: "GET",
        source: "server",
        success: false,
        duration: performance.now() - start,
        cached: false,
        userId,
        error: verifyError instanceof Error ? verifyError.message : "Unknown verification error",
        details: { verifyError },
      })

      // Fallback ke user dari session jika verifikasi gagal
      return { user: data.session.user, error: null }
    }
  } catch (err) {
    error = err
    return { user: null, error: err }
  } finally {
    // Log permintaan keseluruhan
    logAuthRequest({
      endpoint: "getVerifiedUser",
      method: "GET",
      source: "server",
      success,
      duration: performance.now() - start,
      cached: false,
      userId,
      error: error ? String(error) : undefined,
      details: {
        sessionData: sessionData ? true : false,
        finalSuccess: success,
      },
    })
  }
}

// Fungsi helper untuk memeriksa apakah user adalah admin
export const isAdmin = async (userId: string) => {
  let supabase
  try {
    supabase = createClient()
  } catch (err) {
    logAuthRequest({
      endpoint: "isAdmin",
      method: "INTERNAL",
      source: "server",
      success: false,
      duration: 0,
      cached: false,
      userId,
      error: err instanceof Error ? err.message : "Error creating client",
      details: { error: err },
    })
    return false
  }

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
