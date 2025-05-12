import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

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
}

// Fungsi helper untuk memeriksa apakah user adalah admin
export const isAdmin = async (userId: string) => {
  const supabase = createClient()

  const { data: userData } = await supabase.from("users").select("email").eq("id", userId).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  return adminEmails.includes(userData?.email || "")
}
