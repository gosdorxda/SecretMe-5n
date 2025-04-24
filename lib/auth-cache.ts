import type { Session } from "@supabase/supabase-js"
import { recordAuthRequest } from "./auth-monitor"

// Kunci untuk menyimpan data di localStorage
const AUTH_SESSION_CACHE_KEY = "auth_session_cache"
const AUTH_SESSION_EXPIRY_KEY = "auth_session_expiry"

// Durasi cache dalam milidetik (5 menit)
const CACHE_DURATION = 5 * 60 * 1000

// Fungsi untuk menyimpan sesi auth di cache
export function cacheAuthSession(session: Session | null): void {
  try {
    // Simpan sesi
    localStorage.setItem(AUTH_SESSION_CACHE_KEY, JSON.stringify(session))

    // Simpan waktu kedaluwarsa
    const expiry = Date.now() + CACHE_DURATION
    localStorage.setItem(AUTH_SESSION_EXPIRY_KEY, expiry.toString())

    // Catat penggunaan cache untuk monitoring
    recordAuthRequest({
      endpoint: "cache/set",
      success: true,
      duration: 0,
      source: "client",
      cached: true,
    })
  } catch (error) {
    console.error("Error caching auth session:", error)
  }
}

// Fungsi untuk mendapatkan sesi auth dari cache
export function getCachedAuthSession(): Session | null | undefined {
  try {
    // Periksa apakah cache masih valid
    if (!isAuthCacheValid()) {
      return undefined
    }

    // Ambil sesi dari cache
    const cachedSession = localStorage.getItem(AUTH_SESSION_CACHE_KEY)

    if (!cachedSession) {
      return null
    }

    // Catat penggunaan cache untuk monitoring
    recordAuthRequest({
      endpoint: "cache/get",
      success: true,
      duration: 0,
      source: "client",
      cached: true,
    })

    return JSON.parse(cachedSession)
  } catch (error) {
    console.error("Error getting cached auth session:", error)
    return undefined
  }
}

// Fungsi untuk memeriksa apakah cache masih valid
export function isAuthCacheValid(): boolean {
  try {
    const expiryString = localStorage.getItem(AUTH_SESSION_EXPIRY_KEY)

    if (!expiryString) {
      return false
    }

    const expiry = Number.parseInt(expiryString, 10)
    return Date.now() < expiry
  } catch (error) {
    console.error("Error checking auth cache validity:", error)
    return false
  }
}

// Fungsi untuk memperpanjang waktu kedaluwarsa cache
export function extendAuthCacheExpiry(): void {
  try {
    const expiry = Date.now() + CACHE_DURATION
    localStorage.setItem(AUTH_SESSION_EXPIRY_KEY, expiry.toString())
  } catch (error) {
    console.error("Error extending auth cache expiry:", error)
  }
}

// Fungsi untuk membersihkan cache
export function clearAuthCache(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_CACHE_KEY)
    localStorage.removeItem(AUTH_SESSION_EXPIRY_KEY)

    // Catat pembersihan cache untuk monitoring
    recordAuthRequest({
      endpoint: "cache/clear",
      success: true,
      duration: 0,
      source: "client",
      cached: false,
    })
  } catch (error) {
    console.error("Error clearing auth cache:", error)
  }
}
