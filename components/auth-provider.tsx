"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import {
  cacheAuthSession,
  getCachedAuthSession,
  clearAuthCache,
  isAuthCacheValid,
  extendAuthCacheExpiry,
} from "@/lib/auth-cache"

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

// Daftar rute yang memerlukan autentikasi
const PROTECTED_ROUTES = ["/dashboard", "/premium", "/settings"]

// Fungsi untuk memeriksa apakah rute saat ini memerlukan autentikasi
function isProtectedRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const refreshingRef = useRef(false)
  const lastAuthCheckRef = useRef<number>(0)
  const isCurrentRouteProtected = isProtectedRoute(pathname)

  // Throttle auth checks to prevent too many requests
  const THROTTLE_INTERVAL = 10000 // 10 seconds

  // Custom sign out function to handle redirects and state cleanup
  const signOut = async () => {
    try {
      // Tambahkan pengecekan session sebelum logout
      const { data: userData } = await supabase.auth.getUser()

      if (userData?.user) {
        await supabase.auth.signOut()
      } else {
        console.log("No active session found, clearing state only")
      }

      // Selalu bersihkan state lokal terlepas dari hasil API
      setSession(null)
      setUser(null)
      clearAuthCache() // Clear auth cache on sign out

      if (pathname?.startsWith("/dashboard")) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error signing out:", error)
      // Tetap bersihkan state dan redirect meskipun ada error
      setSession(null)
      setUser(null)
      clearAuthCache()

      if (pathname?.startsWith("/dashboard")) {
        router.push("/login")
      }
    }
  }

  // Fungsi untuk refresh session data
  const refreshSession = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true

    try {
      // Check if we should use the cache
      const now = Date.now()
      const timeSinceLastCheck = now - lastAuthCheckRef.current

      if (timeSinceLastCheck < THROTTLE_INTERVAL && isAuthCacheValid()) {
        console.log(
          `🔄 Auth check throttled (${Math.round(timeSinceLastCheck / 1000)}s < ${THROTTLE_INTERVAL / 1000}s), using cache`,
        )
        extendAuthCacheExpiry() // Extend cache expiry
        refreshingRef.current = false
        return
      }

      lastAuthCheckRef.current = now

      // Periksa apakah ada sesi di localStorage sebelum mencoba getUser
      // Ini mencegah error "Auth session missing" di halaman publik
      const hasLocalStorageSession =
        typeof window !== "undefined" && localStorage.getItem("supabase.auth.token") !== null

      // Jika ini bukan rute yang dilindungi dan tidak ada sesi di localStorage,
      // kita tidak perlu memverifikasi sesi
      if (!isCurrentRouteProtected && !hasLocalStorageSession) {
        setSession(null)
        setUser(null)
        setLoading(false)
        refreshingRef.current = false
        return
      }

      // Coba dapatkan sesi dari cache terlebih dahulu
      const cachedSession = getCachedAuthSession()

      // Jika tidak ada sesi di cache dan ini bukan rute yang dilindungi,
      // kita tidak perlu memverifikasi dengan server
      if (cachedSession === null && !isCurrentRouteProtected) {
        setSession(null)
        setUser(null)
        setLoading(false)
        refreshingRef.current = false
        return
      }

      // Hanya lakukan getUser jika ada indikasi bahwa pengguna mungkin login
      // atau jika ini adalah rute yang dilindungi
      if (hasLocalStorageSession || isCurrentRouteProtected || cachedSession) {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          // Jangan log error untuk halaman publik jika error adalah "Auth session missing"
          if (isCurrentRouteProtected || !userError.message?.includes("Auth session missing")) {
            console.error("Error verifying user:", userError)
          }

          // Jika error autentikasi, bersihkan state
          if (
            userError.message?.includes("Auth session missing") ||
            userError.name === "AuthApiError" ||
            userError.message?.includes("refresh_token")
          ) {
            setSession(null)
            setUser(null)
            clearAuthCache()
          }

          setLoading(false)
          refreshingRef.current = false
          return
        }

        // Jika user terverifikasi, dapatkan session lengkap
        if (userData.user) {
          // Gunakan getSession hanya untuk mendapatkan token, bukan data user
          const { data: sessionData } = await supabase.auth.getSession()
          setSession(sessionData?.session || null)
          // Gunakan data user dari getUser yang lebih aman
          setUser(userData.user)
          cacheAuthSession(sessionData?.session || null)
        } else {
          // Tidak ada user yang terautentikasi
          setSession(null)
          setUser(null)
          cacheAuthSession(null)
        }
      } else {
        // Tidak ada indikasi login, set state ke null
        setSession(null)
        setUser(null)
      }

      setLoading(false)
    } catch (error) {
      console.error("Unexpected error refreshing session:", error)
      setLoading(false)
    } finally {
      refreshingRef.current = false
    }
  }, [supabase, isCurrentRouteProtected])

  // Fetch session and set up auth listener
  useEffect(() => {
    let mounted = true
    let authSubscription: { unsubscribe: () => void } | undefined = undefined

    // Initial session check
    const initializeAuth = async () => {
      try {
        // Try to get from cache first on initial load
        const cachedSession = getCachedAuthSession()

        if (cachedSession !== undefined && mounted) {
          // Jika menggunakan cache, tetap verifikasi user dengan getUser
          if (cachedSession) {
            try {
              const { data: userData } = await supabase.auth.getUser()
              if (userData?.user) {
                setUser(userData.user) // Gunakan data user dari getUser yang lebih aman
              } else {
                // Jika getUser gagal memverifikasi, bersihkan cache
                clearAuthCache()
                setSession(null)
                setUser(null)
              }
            } catch (e) {
              console.error("Error verifying cached user:", e)
              clearAuthCache()
              setSession(null)
              setUser(null)
            }
          } else {
            setSession(null)
            setUser(null)
          }

          setLoading(false)

          // Still refresh in background if we used cache
          refreshSession()
          return
        }

        // No valid cache, do a full refresh
        await refreshSession()
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log("Auth state changed:", event)

        if (mounted) {
          // Untuk event yang mengubah state auth, verifikasi dengan getUser
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            try {
              // Verifikasi user dengan getUser yang lebih aman
              const { data: userData } = await supabase.auth.getUser()
              if (userData?.user) {
                setSession(newSession)
                setUser(userData.user) // Gunakan data user dari getUser
                cacheAuthSession(newSession)
              }
            } catch (e) {
              console.error(`Error verifying user after ${event}:`, e)
            }
          } else {
            // Untuk event lain (SIGNED_OUT), cukup update state
            setSession(newSession)
            setUser(newSession?.user ?? null)

            // Update cache when auth state changes
            if (event === "SIGNED_OUT") {
              clearAuthCache()
            } else {
              cacheAuthSession(newSession)
            }
          }

          setLoading(false)
        }

        // Handle sign out
        if (event === "SIGNED_OUT") {
          console.log("👋 User signed out")
          clearAuthCache()
        }
      })

      // Safely store the subscription for cleanup
      if (data && data.subscription && typeof data.subscription.unsubscribe === "function") {
        authSubscription = data.subscription
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error)
      setLoading(false)
    }

    return () => {
      mounted = false
      // Safely unsubscribe only if the subscription exists and has the unsubscribe method
      if (authSubscription && typeof authSubscription.unsubscribe === "function") {
        try {
          authSubscription.unsubscribe()
        } catch (error) {
          console.error("Error unsubscribing from auth listener:", error)
        }
      }
    }
  }, [supabase, refreshSession])

  // Protect routes
  useEffect(() => {
    if (!loading && !session && pathname?.startsWith("/dashboard")) {
      console.log("🔍 AUTH PROVIDER: Redirecting to login from protected route", pathname)
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [session, loading, pathname, router])

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, refreshSession }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
