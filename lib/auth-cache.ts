"use server"
import { createClient } from "@/lib/supabase/server"
import { logAuthRequest } from "@/lib/auth-logger"
import type { Session } from "@supabase/supabase-js"

// Fungsi untuk memeriksa apakah device adalah mobile
// Diubah menjadi async function
export async function isMobileDevice(): Promise<boolean> {
  return false // Selalu false di server
}

// Fungsi untuk mendapatkan session dengan caching
export async function getSessionCache() {
  const start = performance.now()
  let success = false
  let error = null

  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { session: null, user: null, error: null }
    }

    success = true
    return { session, user: session.user, error: null }
  } catch (err) {
    error = err
    console.error("Error in getSessionCache:", err)
    return { session: null, user: null, error: err }
  } finally {
    // Log permintaan
    logAuthRequest({
      endpoint: "getSessionCache",
      method: "GET",
      source: "server",
      success,
      duration: performance.now() - start,
      cached: false,
      error: error ? String(error) : undefined,
    })
  }
}

// Fungsi untuk mendapatkan user dengan caching
export async function getUserCache() {
  const start = performance.now()
  let success = false
  let error = null

  try {
    const { session, user, error: sessionError } = await getSessionCache()

    if (sessionError) {
      error = sessionError
      return { user: null, error: sessionError }
    }

    success = true
    return { user, error: null }
  } catch (err) {
    error = err
    console.error("Error in getUserCache:", err)
    return { user: null, error: err }
  } finally {
    // Log permintaan
    logAuthRequest({
      endpoint: "getUserCache",
      method: "GET",
      source: "server",
      success,
      duration: performance.now() - start,
      cached: false,
      error: error ? String(error) : undefined,
    })
  }
}

// Fungsi untuk memeriksa apakah user adalah admin
export async function isAdminCache(userId: string) {
  if (!userId) return false

  const start = performance.now()
  let success = false
  let error = null

  try {
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.from("users").select("email").eq("id", userId).single()

    if (userError) {
      error = userError
      console.error("Error checking admin status:", userError)
      return false
    }

    // Daftar email admin
    const adminEmails = ["gosdorxda@gmail.com"]
    success = true
    return adminEmails.includes(userData?.email || "")
  } catch (err) {
    error = err
    console.error("Error in isAdminCache:", err)
    return false
  } finally {
    // Log permintaan
    logAuthRequest({
      endpoint: "isAdminCache",
      method: "GET",
      source: "server",
      success,
      duration: performance.now() - start,
      cached: false,
      error: error ? String(error) : undefined,
    })
  }
}

// Fungsi helper untuk verifikasi JWT secara lokal
// Diubah menjadi async function
export async function verifySessionLocally(session: Session | null): Promise<boolean> {
  if (!session) return false

  // Periksa apakah token sudah kedaluwarsa
  const expiresAt = session.expires_at
  if (!expiresAt) return false

  // Konversi ke timestamp (dalam detik)
  const expiryTimestamp = expiresAt * 1000
  const now = Date.now()

  return expiryTimestamp > now
}
