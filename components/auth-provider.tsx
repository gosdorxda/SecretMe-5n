"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient, handleInvalidRefreshToken, resetClient } from "@/lib/supabase/client"
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

// Meningkatkan interval throttle untuk mengurangi auth requests
const THROTTLE_INTERVAL = 600000 // 10 menit (dari 5 menit)
// Interval throttle yang lebih pendek untuk mobile
const MOBILE_THROTTLE_INTERVAL = 300000 // 5 menit untuk mobile

// Tambahkan fungsi untuk mendeteksi mobile
const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
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

  // Tambahkan flag untuk mencegah multiple auth checks pada initial load
  const initialAuthCheckDoneRef = useRef(false)

  // Tambahkan flag untuk mencegah multiple refresh
  const isRefreshingTokenRef = useRef(false)
  const lastRefreshTimeRef = useRef(0)
  const MIN_REFRESH_INTERVAL = 600000 // 10 menit (dari 5 menit)

  // Tambahkan flag untuk mendeteksi error rate limit
  const hasHitRateLimitRef = useRef(false)
  const rateLimitResetTimeRef = useRef(0)
  const RATE_LIMIT_BACKOFF = 600000 // 10 menit

  const signOut = useCallback(async () => {
    try {
      // Bersihkan state dan cache terlebih dahulu
      clearAuthCache()
      setSession(null)
      setUser(null)

      // Reset flags
      refreshingRef.current = false
      isRefreshingTokenRef.current = false
      hasHitRateLimitRef.current = false

      // Hapus token dari localStorage untuk mencegah error
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.token")
      }

      try {
        // Coba sign out dari Supabase
        await supabase.auth.signOut()
      } catch (signOutError) {
        // Jika gagal, log error tapi tetap lanjutkan
        console.warn("Error during signOut API call:", signOutError)
      }

      // Reset client untuk membersihkan state
      resetClient()

      // Redirect ke login page
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)

      // Jika terjadi error, tetap redirect ke login
      router.push("/login")
      router.refresh()
    }
  }, [supabase, router])

  // Fungsi untuk menangani error rate limit
  const handleRateLimitError = useCallback(
    (error: any) => {
      if (error?.status === 429 || (error?.message && error.message.includes("rate limit"))) {
        hasHitRateLimitRef.current = true
        rateLimitResetTimeRef.current = Date.now() + RATE_LIMIT_BACKOFF
        console.warn(`Rate limit hit, backing off for ${RATE_LIMIT_BACKOFF / 60000} minutes`)
        return true
      }
      return false
    },
    [RATE_LIMIT_BACKOFF],
  )

  // Fungsi untuk menangani invalid refresh token
  const handleRefreshTokenError = useCallback(
    (error: any) => {
      if (
        error?.message?.includes("Invalid Refresh Token") ||
        error?.message?.includes("refresh_token_not_found") ||
        error?.code === "refresh_token_not_found"
      ) {
        console.warn("Invalid refresh token detected, signing out")
        handleInvalidRefreshToken()
        signOut()
        return true
      }
      return false
    },
    [signOut],
  )

  const refreshSession = useCallback(async () => {
    // Hindari multiple refresh
    if (refreshingRef.current || isRefreshingTokenRef.current) return

    // Jika sudah hit rate limit, skip refresh
    if (hasHitRateLimitRef.current && Date.now() < rateLimitResetTimeRef.current) {
      console.warn("Skipping session refresh due to rate limit")
      return
    }

    // Deteksi apakah ini perangkat mobile
    const isMobile =
      typeof navigator !== "undefined"
        ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        : false

    // Kurangi throttling untuk mobile
    const now = Date.now()
    if (!isMobile && now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
      return
    } else if (isMobile && now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL / 2) {
      return
    }

    refreshingRef.current = true
    isRefreshingTokenRef.current = true
    lastRefreshTimeRef.current = now

    try {
      // Check if we should use the cache
      const timeSinceLastCheck = now - lastAuthCheckRef.current

      // Gunakan cache lebih agresif untuk desktop, kurang agresif untuk mobile
      if (!isMobile && timeSinceLastCheck < THROTTLE_INTERVAL && isAuthCacheValid()) {
        extendAuthCacheExpiry() // Extend cache expiry
        refreshingRef.current = false
        isRefreshingTokenRef.current = false
        return
      } else if (isMobile && timeSinceLastCheck < THROTTLE_INTERVAL / 2 && isAuthCacheValid()) {
        extendAuthCacheExpiry() // Extend cache expiry
        refreshingRef.current = false
        isRefreshingTokenRef.current = false
        return
      }

      lastAuthCheckRef.current = now

      // Log refresh attempt
      // recordAuthRequest({
      //   endpoint: "refreshSession",
      //   success: true,
      //   duration: 0,
      //   source: "client",
      //   cached: false,
      //   details: {
      //     isMobile,
      //     action: "start"
      //   }
      // })

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
              isRefreshingTokenRef.current = false
              return
            }

            // Verifikasi user dengan server auth
            const { data: userData, error: userError } = await supabase.auth.getUser()

            if (userError) {
              // Periksa apakah error adalah rate limit
              if (handleRateLimitError(userError)) {
                refreshingRef.current = false
                isRefreshingTokenRef.current = false
                return
              }

              // Periksa apakah error adalah invalid refresh token
              if (handleRefreshTokenError(userError)) {
                refreshingRef.current = false
                isRefreshingTokenRef.current = false
                return
              }

              // Jangan log error jika hanya "Auth session missing"
              if (userError.message !== "Auth session missing!") {
                console.error("Error verifying user:", userError)
              }

              // Jika error adalah "Auth session missing", jangan langsung sign out
              // Ini mungkin hanya masalah sementara
              if (userError.message === "Auth session missing!") {
                console.warn("Auth session missing during verification, will retry later")
                refreshingRef.current = false
                isRefreshingTokenRef.current = false
                return
              }

              // Untuk mobile, coba sekali lagi dengan getSession sebelum sign out
              if (isMobile) {
                try {
                  const { data: sessionData } = await supabase.auth.getSession()
                  if (sessionData?.session) {
                    console.log("Session recovered for mobile device")
                    setSession(sessionData.session)
                    setUser(sessionData.session.user)
                    cacheAuthSession(sessionData.session)
                    refreshingRef.current = false
                    isRefreshingTokenRef.current = false
                    return
                  }
                } catch (retryError) {
                  console.error("Error during mobile session retry:", retryError)
                }
              }

              await signOut()
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            if (!userData.user) {
              console.warn("No user data returned from getUser")
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            // Update user dengan data yang terverifikasi
            setUser(userData.user)
          } catch (verifyError) {
            // Periksa apakah error adalah rate limit
            if (handleRateLimitError(verifyError)) {
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            // Periksa apakah error adalah invalid refresh token
            if (handleRefreshTokenError(verifyError)) {
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            // Tangani error dengan lebih baik
            if (verifyError instanceof Error && verifyError.message.includes("Auth session missing")) {
              console.warn("Auth session missing during verification, will retry later")
            } else {
              console.error("Error during user verification:", verifyError)
              await signOut()
            }
            refreshingRef.current = false
            isRefreshingTokenRef.current = false
            return
          }
        } else if (!cachedSession) {
          setUser(null)
        }

        setLoading(false)
        refreshingRef.current = false
        isRefreshingTokenRef.current = false
        return
      }

      // No valid cache, fetch from Supabase
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          // Periksa apakah error adalah rate limit
          if (handleRateLimitError(sessionError)) {
            refreshingRef.current = false
            isRefreshingTokenRef.current = false
            return
          }

          // Periksa apakah error adalah invalid refresh token
          if (handleRefreshTokenError(sessionError)) {
            refreshingRef.current = false
            isRefreshingTokenRef.current = false
            return
          }

          console.error("Error getting session:", sessionError)

          // Handle refresh token errors by signing out
          if (sessionError.message?.includes("refresh_token_already_used") || sessionError.name === "AuthApiError") {
            console.log("🔄 Auth token error detected, signing out and resetting state")
            await signOut()
          }

          refreshingRef.current = false
          isRefreshingTokenRef.current = false
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
              isRefreshingTokenRef.current = false
              return
            }

            // Verifikasi user dengan server auth
            const { data: userData, error: userError } = await supabase.auth.getUser()

            if (userError) {
              // Periksa apakah error adalah rate limit
              if (handleRateLimitError(userError)) {
                refreshingRef.current = false
                isRefreshingTokenRef.current = false
                return
              }

              // Periksa apakah error adalah invalid refresh token
              if (handleRefreshTokenError(userError)) {
                refreshingRef.current = false
                isRefreshingTokenRef.current = false
                return
              }

              // Jangan log error jika hanya "Auth session missing"
              if (userError.message !== "Auth session missing!") {
                console.error("Error verifying user:", userError)
              }

              // Jika error adalah "Auth session missing", jangan langsung sign out
              if (userError.message === "Auth session missing!") {
                console.warn("Auth session missing during verification, will retry later")
                refreshingRef.current = false
                isRefreshingTokenRef.current = false
                return
              }

              // Untuk mobile, coba sekali lagi dengan getSession sebelum sign out
              if (isMobile) {
                try {
                  const { data: retrySessionData } = await supabase.auth.getSession()
                  if (retrySessionData?.session) {
                    console.log("Session recovered for mobile device")
                    setSession(retrySessionData.session)
                    setUser(retrySessionData.session.user)
                    cacheAuthSession(retrySessionData.session)
                    refreshingRef.current = false
                    isRefreshingTokenRef.current = false
                    return
                  }
                } catch (retryError) {
                  console.error("Error during mobile session retry:", retryError)
                }
              }

              await signOut()
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            if (!userData.user) {
              console.warn("No user data returned from getUser")
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            // Gunakan user yang terverifikasi
            verifiedUser = userData.user
          } catch (verifyError) {
            // Periksa apakah error adalah rate limit
            if (handleRateLimitError(verifyError)) {
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            // Periksa apakah error adalah invalid refresh token
            if (handleRefreshTokenError(verifyError)) {
              refreshingRef.current = false
              isRefreshingTokenRef.current = false
              return
            }

            // Tangani error dengan lebih baik
            if (verifyError instanceof Error && verifyError.message.includes("Auth session missing")) {
              console.warn("Auth session missing during verification, will retry later")
            } else {
              console.error("Error during user verification:", verifyError)
              await signOut()
            }
            refreshingRef.current = false
            isRefreshingTokenRef.current = false
            return
          }
        }

        // Cache the session data
        cacheAuthSession(sessionData?.session ?? null)

        setSession(sessionData?.session ?? null)
        setUser(verifiedUser)
        setLoading(false)
      } catch (sessionError) {
        // Periksa apakah error adalah rate limit
        handleRateLimitError(sessionError)

        // Periksa apakah error adalah invalid refresh token
        handleRefreshTokenError(sessionError)

        console.error("Error fetching session:", sessionError)
        setLoading(false)
      }
    } catch (error) {
      // Periksa apakah error adalah rate limit
      handleRateLimitError(error)

      // Periksa apakah error adalah invalid refresh token
      handleRefreshTokenError(error)

      console.error("Unexpected error refreshing session:", error)
      setLoading(false)
    } finally {
      refreshingRef.current = false
      isRefreshingTokenRef.current = false
    }
  }, [supabase, signOut, router, user, handleRateLimitError, handleRefreshTokenError])

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
        // Deteksi apakah ini perangkat mobile
        const isMobile = isMobileDevice()

        // Log initial auth check
        // recordAuthRequest({
        //   endpoint: "initializeAuth",
        //   success: true,
        //   duration: 0,
        //   source: "client",
        //   cached: false,
        //   details: {
        //     isMobile,
        //     action: "start"
        //   }
        // })

        // Try to get from cache first on initial load
        const cachedSession = getCachedAuthSession()

        if (cachedSession !== undefined && mounted) {
          setSession(cachedSession)
          setUser(cachedSession?.user ?? null)
          setLoading(false)

          // Refresh in background hanya jika ada session tapi tidak ada user
          if (cachedSession && !cachedSession.user) {
            // Delay refresh untuk menghindari multiple requests
            // Kurangi delay untuk mobile
            setTimeout(
              () => {
                refreshSession()
              },
              isMobile ? 2000 : 5000,
            ) // 2 detik untuk mobile, 5 detik untuk desktop
          }
          return
        }

        // No valid cache, do a full refresh
        await refreshSession()
      } catch (error) {
        // Periksa apakah error adalah rate limit
        handleRateLimitError(error)

        // Periksa apakah error adalah invalid refresh token
        handleRefreshTokenError(error)

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

          // Log auth state change
          // recordAuthRequest({
          //   endpoint: "authStateChange",
          //   success: true,
          //   duration: 0,
          //   source: "client",
          //   cached: false,
          //   details: {
          //     event,
          //     hasSession: !!newSession
          //   }
          // })
        }

        // If token was refreshed, update the session
        if (event === "TOKEN_REFRESHED") {
          cacheAuthSession(newSession)
          // Update last refresh time to prevent multiple refreshes
          lastRefreshTimeRef.current = Date.now()

          // Log token refresh
          // recordAuthRequest({
          //   endpoint: "tokenRefreshed",
          //   success: true,
          //   duration: 0,
          //   source: "client",
          //   cached: false,
          //   details: {
          //     event,
          //     hasSession: !!newSession
          //   }
          // })
        }

        // Handle sign out
        if (event === "SIGNED_OUT") {
          clearAuthCache()
          // Reset flags
          refreshingRef.current = false
          isRefreshingTokenRef.current = false
          hasHitRateLimitRef.current = false

          // Log sign out
          // recordAuthRequest({
          //   endpoint: "signedOut",
          //   success: true,
          //   duration: 0,
          //   source: "client",
          //   cached: false,
          //   details: {
          //     event
          //   }
          // })
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
  }, [supabase, refreshSession, handleRateLimitError, handleRefreshTokenError])

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
