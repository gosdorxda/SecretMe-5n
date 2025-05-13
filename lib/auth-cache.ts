import type { Session } from "@supabase/supabase-js"
import { recordAuthRequest } from "./auth-monitor"

// Kunci untuk menyimpan data di localStorage
const AUTH_SESSION_CACHE_KEY = "auth_session_cache"
const AUTH_SESSION_EXPIRY_KEY = "auth_session_expiry"
const AUTH_SESSION_DEVICE_KEY = "auth_session_device"

// Durasi cache dalam milidetik (10 menit)
const CACHE_DURATION = 10 * 60 * 1000
// Durasi cache yang lebih pendek untuk mobile (5 menit)
const MOBILE_CACHE_DURATION = 5 * 60 * 1000

export const AUTH_CACHE_TTL = 600000 // 10 menit
export const MOBILE_AUTH_CACHE_TTL = 300000 // 5 menit untuk mobile

// Fungsi untuk mendeteksi perangkat mobile
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Fungsi untuk menyimpan sesi auth di cache
export function cacheAuthSession(session: Session | null): void {
  try {
    // Simpan sesi
    localStorage.setItem(AUTH_SESSION_CACHE_KEY, JSON.stringify(session))

    // Simpan waktu kedaluwarsa berdasarkan tipe perangkat
    const isMobile = isMobileDevice()
    const duration = isMobile ? MOBILE_CACHE_DURATION : CACHE_DURATION
    const expiry = Date.now() + duration
    localStorage.setItem(AUTH_SESSION_EXPIRY_KEY, expiry.toString())

    // Simpan informasi perangkat
    localStorage.setItem(AUTH_SESSION_DEVICE_KEY, isMobile ? "mobile" : "desktop")

    // Catat penggunaan cache untuk monitoring
    recordAuthRequest({
      endpoint: "cache/set",
      success: true,
      duration: 0,
      source: "client",
      cached: true,
      details: {
        isMobile,
        cacheDuration: duration,
      },
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

    // Periksa apakah perangkat saat ini sama dengan perangkat saat cache dibuat
    const cachedDevice = localStorage.getItem(AUTH_SESSION_DEVICE_KEY) || "unknown"
    const currentDevice = isMobileDevice() ? "mobile" : "desktop"

    // Jika perangkat berbeda, invalidasi cache
    if (cachedDevice !== currentDevice) {
      console.warn("Device type changed, invalidating auth cache")
      clearAuthCache()
      return undefined
    }

    // Catat penggunaan cache untuk monitoring
    recordAuthRequest({
      endpoint: "cache/get",
      success: true,
      duration: 0,
      source: "client",
      cached: true,
      details: {
        device: currentDevice,
        cachedDevice,
      },
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

    // Tambahkan margin 10 detik untuk mencegah race condition
    return Date.now() < expiry - 10000
  } catch (error) {
    console.error("Error checking auth cache validity:", error)
    return false
  }
}

// Fungsi untuk memperpanjang waktu kedaluwarsa cache
export function extendAuthCacheExpiry(): void {
  try {
    const isMobile = isMobileDevice()
    const duration = isMobile ? MOBILE_CACHE_DURATION : CACHE_DURATION
    const expiry = Date.now() + duration
    localStorage.setItem(AUTH_SESSION_EXPIRY_KEY, expiry.toString())

    // Update informasi perangkat
    localStorage.setItem(AUTH_SESSION_DEVICE_KEY, isMobile ? "mobile" : "desktop")
  } catch (error) {
    console.error("Error extending auth cache expiry:", error)
  }
}

// Fungsi untuk membersihkan cache
export function clearAuthCache(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_CACHE_KEY)
    localStorage.removeItem(AUTH_SESSION_EXPIRY_KEY)
    localStorage.removeItem(AUTH_SESSION_DEVICE_KEY)

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

// Fungsi untuk memeriksa apakah token akan segera kedaluwarsa
export function isTokenExpiringSoon(session: Session | null): boolean {
  if (!session || !session.expires_at) return false

  // Token dianggap akan segera kedaluwarsa jika kurang dari 5 menit
  const expiryTime = session.expires_at * 1000 // Convert to milliseconds
  const timeUntilExpiry = expiryTime - Date.now()
  return timeUntilExpiry < 5 * 60 * 1000 // 5 menit
}

// Fungsi untuk memeriksa apakah token sudah kedaluwarsa
export function isTokenExpired(session: Session | null): boolean {
  if (!session || !session.expires_at) return true

  const expiryTime = session.expires_at * 1000 // Convert to milliseconds
  return Date.now() > expiryTime
}
