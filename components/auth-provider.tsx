"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient, resetClient } from "@/lib/supabase/client"
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const refreshingRef = useRef(false)
  const lastAuthCheckRef = useRef<number>(0)

  // Throttle auth checks to prevent too many requests
  const THROTTLE_INTERVAL = 10000 // 10 seconds

  // Custom sign out function to handle redirects and state cleanup
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      clearAuthCache() // Clear auth cache on sign out

      // PERBAIKAN: Reset client setelah sign out
      resetClient()

      if (pathname?.startsWith("/dashboard")) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error signing out:", error)
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

      // PERBAIKAN: Coba refresh token terlebih dahulu
      console.log("🔄 Attempting to refresh auth session")
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshData?.session) {
        console.log("✅ Session refreshed successfully")
        setSession(refreshData.session)
        setUser(refreshData.session.user)
        cacheAuthSession(refreshData.session)
        setLoading(false)
        refreshingRef.current = false
        return
      } else if (refreshError) {
        console.log("⚠️ Session refresh failed:", refreshError.message)
        // Continue to try getSession
      }

      // Try to get session from cache first
      const cachedSession = getCachedAuthSession()

      if (cachedSession !== undefined) {
        // We have a valid cached session or null (meaning no session)
        setSession(cachedSession)

        // Selalu verifikasi user dengan getUser() bahkan jika menggunakan cache
        if (cachedSession) {
          // Verifikasi user dengan server auth
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (!userError && userData.user) {
            // Update user dengan data yang terverifikasi
            setUser(userData.user)
          } else if (userError) {
            // Jika verifikasi gagal, sign out
            console.error("Error verifying user:", userError)
            await signOut()
          }
        } else {
          setUser(null)
        }

        setLoading(false)
        refreshingRef.current = false
        return
      }

      // No valid cache, fetch from Supabase
      console.log("🔄 Fetching fresh auth session from Supabase")
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting session:", sessionError)

        // Handle refresh token errors by signing out
        if (sessionError.message?.includes("refresh_token_already_used") || sessionError.name === "AuthApiError") {
          console.log("🔄 Auth token error detected, signing out and resetting state")
          await signOut()
        }

        refreshingRef.current = false
        return
      }

      // Jika ada session, SELALU verifikasi dengan getUser()
      let verifiedUser = null

      if (sessionData?.session) {
        // Verifikasi user dengan server auth
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (!userError && userData.user) {
          // Gunakan user yang terverifikasi
          verifiedUser = userData.user
        } else if (userError) {
          // Jika verifikasi gagal, sign out
          console.error("Error verifying user:", userError)
          await signOut()
          refreshingRef.current = false
          return
        }
      }

      // Cache the session data
      cacheAuthSession(sessionData?.session ?? null)

      setSession(sessionData?.session ?? null)
      setUser(verifiedUser)
      setLoading(false)
    } catch (error) {
      console.error("Unexpected error refreshing session:", error)
      setLoading(false)
    } finally {
      refreshingRef.current = false
    }
  }, [supabase])

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
          setSession(cachedSession)
          setUser(cachedSession?.user ?? null)
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
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        console.log("Auth state changed:", event)

        if (mounted) {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          setLoading(false)

          // Update cache when auth state changes
          cacheAuthSession(newSession)
        }

        // PERBAIKAN: Tambahkan penanganan untuk SIGNED_IN
        if (event === "SIGNED_IN") {
          console.log("🔍 User signed in, verifying session...")
          refreshSession()
        }

        // If token was refreshed, update the session
        if (event === "TOKEN_REFRESHED") {
          console.log("🔄 Token refreshed successfully")
          cacheAuthSession(newSession)
        }

        // Handle sign out
        if (event === "SIGNED_OUT") {
          console.log("👋 User signed out")
          clearAuthCache()
          resetClient() // PERBAIKAN: Reset client setelah sign out
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
