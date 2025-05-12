import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import type { cookies } from "next/headers"
import type { Database } from "./database.types"
import { recordAuthRequest } from "@/lib/auth-monitor"

// Fungsi untuk membuat Supabase client di server
export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  const startTime = performance.now()

  const client = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  })

  // Tambahkan interceptor untuk mencatat permintaan auth
  const originalAuthRequest = client.auth.getUser
  client.auth.getUser = async function (...args) {
    const endpoint = "auth/getUser"
    try {
      const result = await originalAuthRequest.apply(this, args)
      const endTime = performance.now()

      // Catat permintaan berhasil
      recordAuthRequest({
        endpoint,
        success: true,
        duration: endTime - startTime,
        source: "server",
        cached: false,
      })

      return result
    } catch (error) {
      const endTime = performance.now()

      // Catat permintaan gagal
      recordAuthRequest({
        endpoint,
        success: false,
        duration: endTime - startTime,
        source: "server",
        cached: false,
      })

      throw error
    }
  }

  return client
}

// Fungsi helper untuk mendapatkan user terverifikasi
export const getVerifiedUser = async (cookieStore: ReturnType<typeof cookies>) => {
  const supabase = createClient(cookieStore)

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
export const isAdmin = async (userId: string, cookieStore: ReturnType<typeof cookies>) => {
  const supabase = createClient(cookieStore)

  const { data: userData } = await supabase.from("users").select("email").eq("id", userId).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  return adminEmails.includes(userData?.email || "")
}
