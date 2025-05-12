import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

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
    },
  })
}

// Fungsi helper untuk mendapatkan user terverifikasi
export const getVerifiedUser = async () => {
  const supabase = createClient()

  try {
    // Cek session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      // Jangan log error jika hanya "Auth session missing"
      if (sessionError.message !== "Auth session missing!") {
        console.error("Error getting session:", sessionError)
      }
      return { user: null, error: sessionError }
    }

    if (!session) {
      return { user: null, error: "No session" }
    }

    // Tambahkan pemeriksaan token
    if (!session.access_token) {
      return { user: null, error: "Invalid session: no access token" }
    }

    try {
      // Verifikasi user dengan getUser()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        // Jangan log error jika hanya "Auth session missing"
        if (userError.message !== "Auth session missing!") {
          console.error("Error verifying user:", userError)
        }
        return { user: null, error: userError }
      }

      if (!user) {
        return { user: null, error: "User verification failed" }
      }

      return { user, error: null }
    } catch (userError) {
      // Tangani error dengan lebih baik
      if (userError instanceof Error && userError.message.includes("Auth session missing")) {
        return { user: null, error: "Auth session missing" }
      }
      console.error("Unexpected error in getUser:", userError)
      return { user: null, error: "Unexpected error occurred" }
    }
  } catch (error) {
    console.error("Unexpected error in getVerifiedUser:", error)
    return { user: null, error: "Unexpected error occurred" }
  }
}

// Fungsi helper untuk memeriksa apakah user adalah admin
export const isAdmin = async (userId: string) => {
  const supabase = createClient()

  const { data: userData } = await supabase.from("users").select("email").eq("id", userId).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  return adminEmails.includes(userData?.email || "")
}
