import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"
import { logAuthRequest } from "@/lib/auth-logger"

// Fungsi untuk membuat Supabase client untuk server components
export const createClient = () => {
  const cookieStore = cookies()

  // Log creation
  logAuthRequest({
    endpoint: "createServerClient",
    method: "INTERNAL",
    source: "server",
    success: true,
    duration: 0,
    cached: false,
    details: { action: "create" },
  })

  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Fungsi getVerifiedUser yang dioptimasi - hanya menggunakan getSession()
export async function getVerifiedUser() {
  const start = performance.now()
  let success = false
  let error = null
  let userId = null

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

    // Jika kita sampai di sini, kita memiliki user dari session
    userId = data.session.user.id
    success = true

    // Gunakan user dari session tanpa memanggil getUser()
    return { user: data.session.user, error: null }
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
        finalSuccess: success,
      },
    })
  }
}

// Fungsi helper untuk memeriksa apakah user adalah admin
export const isAdmin = async (userId: string) => {
  if (!userId) return false

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
