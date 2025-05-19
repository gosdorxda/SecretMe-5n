import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import type { Session } from "@supabase/supabase-js"

// Cache untuk getSession menggunakan React server cache
export const getSessionCache = cache(async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error("Error getting session:", error)
    return { session: null, user: null, error }
  }

  return {
    session: data.session,
    user: data.session?.user || null,
    error: null,
  }
})

// Pastikan fungsi isAdminCache menggunakan logika yang sama dengan middleware

export const isAdminCache = cache(async (userId: string) => {
  if (!userId) return false

  const supabase = createClient()

  try {
    const { data: userData, error } = await supabase.from("users").select("email").eq("id", userId).single()

    if (error) {
      console.error("Error checking admin status:", error)
      return false
    }

    // Pastikan daftar email admin konsisten di seluruh aplikasi
    const adminEmails = ["gosdorxda@gmail.com"]
    return adminEmails.includes(userData?.email || "")
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
})

// Fungsi helper untuk verifikasi JWT secara lokal
// Ini dapat mengurangi permintaan ke Supabase untuk verifikasi token
export const verifySessionLocally = (session: Session | null) => {
  if (!session) return false

  // Periksa apakah token sudah kedaluwarsa
  const expiresAt = session.expires_at
  if (!expiresAt) return false

  // Konversi ke timestamp (dalam detik)
  const expiryTimestamp = expiresAt * 1000
  const now = Date.now()

  return expiryTimestamp > now
}
