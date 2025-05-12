import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Buat Supabase client yang tidak bergantung pada cookies untuk prerendering
const createDirectClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Server-side Supabase client
export const createClient = () => {
  try {
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
  } catch (error) {
    // Jika cookies tidak tersedia (saat prerendering), gunakan direct client
    console.log("Cookies tidak tersedia, menggunakan direct client")
    return createDirectClient()
  }
}

// Fungsi helper untuk mendapatkan user terverifikasi
export const getVerifiedUser = async () => {
  try {
    const supabase = createClient()

    // Gunakan getUser() untuk autentikasi yang lebih aman
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
    console.error("Error in getVerifiedUser:", error)
    return { user: null, error }
  }
}

// Fungsi helper untuk memeriksa apakah user adalah admin
export const isAdmin = async (userId: string) => {
  try {
    const supabase = createClient()

    const { data: userData } = await supabase.from("users").select("email").eq("id", userId).single()

    const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

    return adminEmails.includes(userData?.email || "")
  } catch (error) {
    console.error("Error in isAdmin:", error)
    return false
  }
}
