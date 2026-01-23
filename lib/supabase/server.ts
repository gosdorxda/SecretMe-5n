import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"
import { logAuthRequest } from "@/lib/auth-logger"

// Server-side Supabase client
export const createClient = () => {
  try {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== "undefined"

    if (isBrowser) {
      // For client-side, we'll use a different approach
      console.warn("Server client being called from browser context - this may not work as expected")

      // Return a dummy client that won't make actual requests
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            order: () => ({
              data: [],
              error: null,
            }),
          }),
          order: () => ({
            data: [],
            error: null,
          }),
        }),
      } as any
    }

    // Only import cookies() in server context
    let cookieStore
    try {
      cookieStore = cookies()
    } catch (cookieError) {
      // Jika cookies() gagal (misalnya saat static rendering), log error
      console.warn("Cookies not available, possibly during static rendering:", cookieError)

      // Return dummy client untuk static rendering
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            order: () => ({
              data: [],
              error: null,
            }),
          }),
          order: () => ({
            data: [],
            error: null,
          }),
        }),
      } as any
    }

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle server action/router context issues
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: "", ...options })
            } catch (error) {
              // Handle server action/router context issues
            }
          },
        },
      },
    )
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

    // Return dummy client
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          order: () => ({
            data: [],
            error: null,
          }),
        }),
        order: () => ({
          data: [],
          error: null,
        }),
      }),
    } as any
  }
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
