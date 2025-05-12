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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const refreshingRef = useRef(false)
  const lastAuthCheckRef = useRef<number>(0)

  // Meningkatkan interval throttle untuk mengurangi auth requests
  const THROTTLE_INTERVAL = 60000 // 1 menit (dari 10 detik)

  // Tambahkan flag untuk mencegah multiple auth checks pada initial load
  const initialAuthCheckDoneRef = useRef(false)

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      clearAuthCache()
      setSession(null)
      setUser(null)
      router.push("/login") // Redirect to login page after sign out
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [supabase, router])

  // Fungsi untuk refresh session data dengan optimasi
  const refreshSession = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true

    try {
      // Check if we should use the cache
      const now = Date.now()
      const timeSinceLastCheck = now - lastAuthCheckRef.current

      // Gunakan cache lebih agresif
      if (timeSinceLastCheck < THROTTLE_INTERVAL && isAuthCacheValid()) {
        extendAuthCacheExpiry() // Extend cache expiry
        refreshingRef.current = false
        return
      }

      lastAuthCheckRef.current = now

      // Try to get session from cache first
      const cachedSession = getCachedAuthSession()

      if (cachedSession !== undefined) {
        // We have a valid cached session or null (meaning no session)
        setSession(cachedSession)

        // Hanya verifikasi user jika ada session dan belum ada user data
        if (cachedSession && !user) {
          try {
            // Verifikasi user dengan server auth - TAMBAHKAN PEMERIKSAAN SESI YANG LEBIH KETAT
            if (!cachedSession.access_token) {
              console.warn("Skipping user verification: No access token in session")
              refreshingRef.current = false
              return
            }

            // Verifikasi user dengan server auth
            const { data: userData, error: userError } = await supabase.auth.getUser()

            if (userError) {
              // Jangan log error jika hanya "Auth session missing"
              if (userError.message !== "Auth session missing!") {
                console.error("Error verifying user:", userError)
              }

              // Jika error adalah "Auth session missing", jangan langsung sign out
              // Ini mungkin hanya masalah sementara
              if (userError.message === "Auth session missing!") {
                console.warn("Auth session missing during verification, will retry later")
                refreshingRef.current = false
                return
              }

              await signOut()
              refreshingRef.current = false
              return
            }

            if (!userData.user) {
              console.warn("No user data returned from getUser")
              refreshingRef.current = false
              return
            }

            // Update user dengan data yang terverifikasi
            setUser(userData.user)
          } catch (verifyError) {
            // Tangani error dengan lebih baik
            if (verifyError instanceof Error && verifyError.message.includes("Auth session missing")) {
              console.warn("Auth session missing during verification, will retry later")
            } else {
              console.error("Error during user verification:", verifyError)
              await signOut()
            }
            refreshingRef.current = false
            return
          }
        } else if (!cachedSession) {
          setUser(null)
        }

        setLoading(false)
        refreshingRef.current = false
        return
      }

      // No valid cache, fetch from Supabase
      try {
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

        // Jika ada session, verifikasi user hanya jika belum ada user data
        let verifiedUser = user

        if (sessionData?.session && !user) {
          try {
            // TAMBAHKAN PEMERIKSAAN SESI YANG LEBIH KETAT
            if (!sessionData.session.access_token) {
              console.warn("Skipping user verification: No access token in session")
              refreshingRef.current = false
              return
            }

            // Verifikasi user dengan server auth
            const { data: userData, error: userError } = await supabase.auth.getUser()

            if (userError) {
              // Jangan log error jika hanya "Auth session missing"
              if (userError.message !== "Auth session missing!") {
                console.error("Error verifying user:", userError)
              }

              // Jika error adalah "Auth session missing", jangan langsung sign out
              if (userError.message === "Auth session missing!") {
                console.warn("Auth session missing during verification, will retry later")
                refreshingRef.current = false
                return
              }

              await signOut()
              refreshingRef.current = false
              return
            }

            if (!userData.user) {
              console.warn("No user data returned from getUser")
              refreshingRef.current = false
              return
            }

            // Gunakan user yang terverifikasi
            verifiedUser = userData.user
          } catch (verifyError) {
            // Tangani error dengan lebih baik
            if (verifyError instanceof Error && verifyError.message.includes("Auth session missing")) {
              console.warn("Auth session missing during verification, will retry later")
            } else {
              console.error("Error during user verification:", verifyError)
              await signOut()
            }
            refreshingRef.current = false
            return
          }
        }

        // Cache the session data
        cacheAuthSession(sessionData?.session ?? null)

        setSession(sessionData?.session ?? null)
        setUser(verifiedUser)
        setLoading(false)
      } catch (sessionError) {
        console.error("Error fetching session:", sessionError)
        setLoading(false)
      }
    } catch (error) {
      console.error("Unexpected error refreshing session:", error)
      setLoading(false)
    } finally {
      refreshingRef.current = false
    }
  }, [supabase, signOut, router, user])

  // Fetch session dan setup auth listener dengan optimasi
  useEffect(() => {
    let mounted = true
    let authSubscription: { unsubscribe: () => void } | undefined = undefined

    // Initial session check
    const initializeAuth = async () => {
      // Hindari multiple initial auth checks
      if (initialAuthCheckDoneRef.current) return
      initialAuthCheckDoneRef.current = true

      try {
        // Try to get from cache first on initial load
        const cachedSession = getCachedAuthSession()

        if (cachedSession !== undefined && mounted) {
          setSession(cachedSession)
          setUser(cachedSession?.user ?? null)
          setLoading(false)

          // Refresh in background hanya jika ada session tapi tidak ada user
          if (cachedSession && !cachedSession.user) {
            refreshSession()
          }
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
        if (mounted) {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          setLoading(false)

          // Update cache when auth state changes
          cacheAuthSession(newSession)
        }

        // If token was refreshed, update the session
        if (event === "TOKEN_REFRESHED") {
          cacheAuthSession(newSession)
        }

        // Handle sign out
        if (event === "SIGNED_OUT") {
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

  // Protect routes - optimasi dengan mengurangi re-renders
  useEffect(() => {
    if (!loading && !session && pathname?.startsWith("/dashboard")) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [session, loading, pathname, router])

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, refreshSession }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
