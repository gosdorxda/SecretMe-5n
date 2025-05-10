import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

export const createClient = () => {
  // Deteksi environment dengan FORCE_PRODUCTION_URLS
  const forceProductionUrls = process.env.FORCE_PRODUCTION_URLS === "true"
  const isProduction = process.env.NODE_ENV === "production" || forceProductionUrls

  // Gunakan COOKIE_DOMAIN jika tersedia
  const domain =
    process.env.COOKIE_DOMAIN ||
    (isProduction && process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "")

  console.log("🔍 SERVER: Creating Supabase client with domain:", domain, "isProduction:", isProduction)

  return createServerComponentClient<Database>({
    cookies,
    options: {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        cookieOptions: {
          name: "sb-auth-token",
          lifetime: 60 * 60 * 8,
          domain: domain || "",
          path: "/",
          sameSite: "lax",
          secure: isProduction,
        },
      },
    },
  })
}

// Fungsi helper untuk mendapatkan user terverifikasi
export const getVerifiedUser = async () => {
  const supabase = createClient()

  // Cek session
  const {
    data: { session },
  } = await supabase.auth.getSession()

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
}

// Fungsi helper untuk memeriksa apakah user adalah admin
export const isAdmin = async (userId: string) => {
  const supabase = createClient()

  const { data: userData } = await supabase.from("users").select("email").eq("id", userId).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  return adminEmails.includes(userData?.email || "")
}
