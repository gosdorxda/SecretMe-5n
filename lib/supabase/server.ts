import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

// Server-side Supabase client
export const createClient = () => {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({
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

  // Tambahkan logging untuk getSession
  const originalGetSession = supabase.auth.getSession
  supabase.auth.getSession = async function () {
    console.log("🔍 SERVER getSession dipanggil dari:", new Error().stack)
    return originalGetSession.apply(this, arguments)
  }

  // Tambahkan logging untuk getUser
  const originalGetUser = supabase.auth.getUser
  supabase.auth.getUser = async function () {
    console.log("🔍 SERVER getUser dipanggil dari:", new Error().stack)
    return originalGetUser.apply(this, arguments)
  }

  return supabase
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
      console.error("Error getting session:", sessionError)
      return { user: null, error: sessionError }
    }

    if (!session) {
      return { user: null, error: "No session" }
    }

    // Verifikasi user dengan getUser()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error verifying user:", userError)
      return { user: null, error: userError || "User verification failed" }
    }

    return { user, error: null }
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
