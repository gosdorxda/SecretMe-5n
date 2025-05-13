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
  isTokenExpiringSoon,
  isTokenExpired,
} from "@/lib/auth-cache"
import { logAuthRequest } from "@/lib/auth-logger"

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
  forceLogout: () => Promise<void> // Tambahkan forceLogout
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  isAuthenticated: false,
  forceLogout: async () => {}, // Tambahkan forceLogout
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

// Tambahkan di bagian atas file, di luar komponen
let lastAuthStateChangeLog = 0
const AUTH_STATE_CHANGE_LOG_THROTTLE = 5000 // 5 detik

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

  // Tambahkan counter untuk retry
  const authRetryCountRef = useRef(0)
  const MAX_AUTH_RETRIES = 3

  // Tambahkan ref untuk melacak subscription
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  const signOut = useCallback(async () => {
    try {
      // Log signOut start
      logAuthRequest({
        endpoint: "signOut",
        method: "INTERNAL",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        details: { action: "start" },
      })

      // Bersihkan state dan cache terlebih dahulu
      clearAuthCache()
      setSession(null)
      setUser(null)
      setIsAuthenticated(false)

      // Reset flags
      refreshingRef.current = false
      isRefreshingTokenRef.current = false
      hasHitRateLimitRef.current = false
      authRetryCountRef.current = 0

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

        // Log error
        logAuthRequest({
          endpoint: "signOut",
          method: "INTERNAL",
          source: "client",
          success: false,
          duration: 0,
          cached: false,
          error: signOutError instanceof Error ? signOutError.message : "Unknown error",
          details: { error: signOutError },
        })
      }

      // Reset client untuk membersihkan state
      resetClient()

      // Log signOut success
      logAuthRequest({
        endpoint: "signOut",
        method: "INTERNAL",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        details: { action: "complete" },
      })

      // Redirect ke login page
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)

      // Log error
      logAuthRequest({
        endpoint: "signOut",
        method: "INTERNAL",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: { error },
      })

      // Jika terjadi error, tetap redirect ke login
      router.push("/login")
      router.refresh()
    }
  }, [supabase, router])

  // Fungsi untuk force logout dalam kasus darurat
  const forceLogout = useCallback(async () => {
    try {
      // Log force logout
      logAuthRequest({
        endpoint: "forceLogout",
        method: "INTERNAL",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        userId: user?.id,
        details: {
          action: "start",
          isMobile: isMobileDevice(),
        },
      })

      // Bersihkan state dan cache
      clearAuthCache()
      setSession(null)
      setUser(null)
      setIsAuthenticated(false)

      // Reset flags
      refreshingRef.current = false
      isRefreshingTokenRef.current = false
      hasHitRateLimitRef.current = false
      authRetryCountRef.current = 0

      // Hapus token dari localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.token")
        // Hapus semua localStorage yang terkait dengan supabase
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("supabase.")) {
            localStorage.removeItem(key)
          }
        })
        // Hapus sessionStorage juga
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith("supabase.")) {
            sessionStorage.removeItem(key)
          }
        })
      }

      // Hapus semua cookie
      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
      }

      // Reset client
      resetClient()

      // Log force logout success
      logAuthRequest({
        endpoint: "forceLogout",
        method: "INTERNAL",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        details: {
          action: "complete",
          isMobile: isMobileDevice(),
        },
      })

      // Hard redirect ke login page
      window.location.href = "/login"
    } catch (error) {
      console.error("Error during force logout:", error)

      // Log error
      logAuthRequest({
        endpoint: "forceLogout",
        method: "INTERNAL",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          error,
          isMobile: isMobileDevice(),
        },
      })

      // Jika terjadi error, tetap redirect ke login dengan hard refresh
      window.location.href = "/login"
    }
  }, [user])

  // Fungsi untuk menangani error rate limit
  const handleRateLimitError = useCallback(
    (error: any) => {
      if (error?.status === 429 || (error?.message && error.message.includes("rate limit"))) {
        hasHitRateLimitRef.current = true
        rateLimitResetTimeRef.current = Date.now() + RATE_LIMIT_BACKOFF
        console.warn(`Rate limit hit, backing off for ${RATE_LIMIT_BACKOFF / 60000} minutes`)

        // Log rate limit
        logAuthRequest({
          endpoint: "rateLimit",
          method: "INTERNAL",
          source: "client",
          success: false,
          duration: 0,
          cached: false,
          error: "Rate limit exceeded",
          details: {
            backoffTime: RATE_LIMIT_BACKOFF,
            resetTime: new Date(rateLimitResetTimeRef.current).toISOString(),
          },
        })

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

        // Log invalid token
        logAuthRequest({
          endpoint: "invalidToken",
          method: "INTERNAL",
          source: "client",
          success: false,
          duration: 0,
          cached: false,
          error: error?.message || "Invalid refresh token",
          details: { error },
        })

        handleInvalidRefreshToken()
        signOut()
        return true
      }
      return false
    },
    [signOut],
  )

  // Fungsi untuk mendeteksi ketidakkonsistenan session
  const detectSessionInconsistency = useCallback(async () => {
    // Jika UI menunjukkan login tapi server tidak memiliki token yang valid
    if (isAuthenticated && (!session || !session.access_token || isTokenExpired(session))) {
      console.warn("Session inconsistency detected, forcing logout")

      // Log inconsistency
      logAuthRequest({
        endpoint: "sessionInconsistency",
        method: "INTERNAL",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        userId: user?.id,
        error: "Session inconsistency detected",
        details: {
          isAuthenticated,
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          isExpired: session ? isTokenExpired(session) : true,
          isMobile: isMobileDevice(),
        },
      })

      // Force logout
      await signOut()
      router.push("/login")
    }
  }, [isAuthenticated, session, user, signOut, router])

  const refreshSession = useCallback(async () => {
    // Hindari multiple refresh
    if (refreshingRef.current || isRefreshingTokenRef.current) return

    // Jika sudah hit rate limit, skip refresh
    if (hasHitRateLimitRef.current && Date.now() < rateLimitResetTimeRef.current) {
      console.warn("Skipping session refresh due to rate limit")
      return
    }

    // Deteksi apakah ini perangkat mobile
    const isMobile = isMobileDevice()

    // Log refresh start
    logAuthRequest({
      endpoint: "refreshSession",
      method: "INTERNAL",
      source: "client",
      success: true,
      duration: 0,
      cached: false,
      details: {
        isMobile,
        action: "start",
        retryCount: authRetryCountRef.current,
      },
    })

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

      // Try to get session from cache first
      const cachedSession = getCachedAuthSession()

      if (cachedSession !== undefined) {
        // We have a valid cached session or null (meaning no session)
        setSession(cachedSession)

        // Periksa apakah token akan segera kedaluwarsa
        if (cachedSession && isTokenExpiringSoon(cachedSession)) {
          console.log("Token is expiring soon, will refresh")

          // Log token expiring
          logAuthRequest({
            endpoint: "tokenExpiring",
            method: "INTERNAL",
            source: "client",
            success: true,
            duration: 0,
            cached: false,
            userId: cachedSession.user?.id,
            details: {
              expiresAt: cachedSession.expires_at ? new Date(cachedSession.expires_at * 1000).toISOString() : null,
            },
          })

          // Force refresh token
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

            if (refreshError) {
              console.error("Error refreshing token:", refreshError)

              // Log refresh error
              logAuthRequest({
                endpoint: "refreshToken",
                method: "INTERNAL",
                source: "client",
                success: false,
                duration: 0,
                cached: false,
                userId: cachedSession.user?.id,
                error: refreshError.message,
                details: { error: refreshError },
              })

              // Handle specific errors
              handleRateLimitError(refreshError)
              handleRefreshTokenError(refreshError)
            } else if (refreshData.session) {
              // Update session with refreshed data
              setSession(refreshData.session)
              setUser(refreshData.session.user)
              setIsAuthenticated(true)
              cacheAuthSession(refreshData.session)

              // Log refresh success
              logAuthRequest({
                endpoint: "refreshToken",
                method: "INTERNAL",
                source: "client",
                success: true,
                duration: 0,
                cached: false,
                userId: refreshData.session.user.id,
                details: {
                  newExpiresAt: refreshData.session.expires_at
                    ? new Date(refreshData.session.expires_at * 1000).toISOString()
                    : null,
                },
              })
            }
          } catch (refreshError) {
            console.error("Error during token refresh:", refreshError)

            // Log refresh error
            logAuthRequest({
              endpoint: "refreshToken",
              method: "INTERNAL",
              source: "client",
              success: false,
              duration: 0,
              cached: false,
              userId: cachedSession.user?.id,
              error: refreshError instanceof Error ? refreshError.message : "Unknown error",
              details: { error: refreshError },
            })
          }
        }

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

                // Increment retry counter
                authRetryCountRef.current++

                // Log retry
                logAuthRequest({
                  endpoint: "authRetry",
                  method: "INTERNAL",
                  source: "client",
                  success: true,
                  duration: 0,
                  cached: false,
                  details: {
                    retryCount: authRetryCountRef.current,
                    maxRetries: MAX_AUTH_RETRIES,
                  },
                })

                // If we've tried too many times, sign out
                if (authRetryCountRef.current >= MAX_AUTH_RETRIES) {
                  console.error(`Auth retry limit (${MAX_AUTH_RETRIES}) reached, signing out`)

                  // Log max retries
                  logAuthRequest({
                    endpoint: "authRetryLimit",
                    method: "INTERNAL",
                    source: "client",
                    success: false,
                    duration: 0,
                    cached: false,
                    details: {
                      retryCount: authRetryCountRef.current,
                      maxRetries: MAX_AUTH_RETRIES,
                    },
                  })

                  await signOut()
                }

                refreshingRef.current = false
                isRefreshingTokenRef.current = false
                return
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
            setIsAuthenticated(true)

            // Reset retry counter on success
            authRetryCountRef.current = 0
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

              // Increment retry counter
              authRetryCountRef.current++

              // Log retry
              logAuthRequest({
                endpoint: "authRetry",
                method: "INTERNAL",
                source: "client",
                success: true,
                duration: 0,
                cached: false,
                details: {
                  retryCount: authRetryCountRef.current,
                  maxRetries: MAX_AUTH_RETRIES,
                },
              })

              // If we've tried too many times, sign out
              if (authRetryCountRef.current >= MAX_AUTH_RETRIES) {
                console.error(`Auth retry limit (${MAX_AUTH_RETRIES}) reached, signing out`)

                // Log max retries
                logAuthRequest({
                  endpoint: "authRetryLimit",
                  method: "INTERNAL",
                  source: "client",
                  success: false,
                  duration: 0,
                  cached: false,
                  details: {
                    retryCount: authRetryCountRef.current,
                    maxRetries: MAX_AUTH_RETRIES,
                  },
                })

                await signOut()
              }
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
          setIsAuthenticated(false)
        } else {
          // We have a session and user data
          setIsAuthenticated(true)
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

                // Increment retry counter
                authRetryCountRef.current++

                // Log retry
                logAuthRequest({
                  endpoint: "authRetry",
                  method: "INTERNAL",
                  source: "client",
                  success: true,
                  duration: 0,
                  cached: false,
                  details: {
                    retryCount: authRetryCountRef.current,
                    maxRetries: MAX_AUTH_RETRIES,
                  },
                })

                // If we've tried too many times, sign out
                if (authRetryCountRef.current >= MAX_AUTH_RETRIES) {
                  console.error(`Auth retry limit (${MAX_AUTH_RETRIES}) reached, signing out`)

                  // Log max retries
                  logAuthRequest({
                    endpoint: "authRetryLimit",
                    method: "INTERNAL",
                    source: "client",
                    success: false,
                    duration: 0,
                    cached: false,
                    details: {
                      retryCount: authRetryCountRef.current,
                      maxRetries: MAX_AUTH_RETRIES,
                    },
                  })

                  await signOut()
                }

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
                    setIsAuthenticated(true)
                    cacheAuthSession(retrySessionData.session)

                    // Reset retry counter on success
                    authRetryCountRef.current = 0

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

            // Reset retry counter on success
            authRetryCountRef.current = 0
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

              // Increment retry counter
              authRetryCountRef.current++

              // Log retry
              logAuthRequest({
                endpoint: "authRetry",
                method: "INTERNAL",
                source: "client",
                success: true,
                duration: 0,
                cached: false,
                details: {
                  retryCount: authRetryCountRef.current,
                  maxRetries: MAX_AUTH_RETRIES,
                },
              })

              // If we've tried too many times, sign out
              if (authRetryCountRef.current >= MAX_AUTH_RETRIES) {
                console.error(`Auth retry limit (${MAX_AUTH_RETRIES}) reached, signing out`)

                // Log max retries
                logAuthRequest({
                  endpoint: "authRetryLimit",
                  method: "INTERNAL",
                  source: "client",
                  success: false,
                  duration: 0,
                  cached: false,
                  details: {
                    retryCount: authRetryCountRef.current,
                    maxRetries: MAX_AUTH_RETRIES,
                  },
                })

                await signOut()
              }
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
        setIsAuthenticated(!!sessionData?.session)
        setLoading(false)

        // Log refresh success
        logAuthRequest({
          endpoint: "refreshSession",
          method: "INTERNAL",
          source: "client",
          success: true,
          duration: 0,
          cached: false,
          userId: verifiedUser?.id,
          details: {
            hasSession: !!sessionData?.session,
            isMobile,
          },
        })
      } catch (sessionError) {
        // Periksa apakah error adalah rate limit
        handleRateLimitError(sessionError)

        // Periksa apakah error adalah invalid refresh token
        handleRefreshTokenError(sessionError)

        console.error("Error fetching session:", sessionError)
        setLoading(false)

        // Log refresh error
        logAuthRequest({
          endpoint: "refreshSession",
          method: "INTERNAL",
          source: "client",
          success: false,
          duration: 0,
          cached: false,
          error: sessionError instanceof Error ? sessionError.message : "Unknown error",
          details: {
            error: sessionError,
            isMobile,
          },
        })
      }
    } catch (error) {
      // Periksa apakah error adalah rate limit
      handleRateLimitError(error)

      // Periksa apakah error adalah invalid refresh token
      handleRefreshTokenError(error)

      console.error("Unexpected error refreshing session:", error)
      setLoading(false)

      // Log refresh error
      logAuthRequest({
        endpoint: "refreshSession",
        method: "INTERNAL",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          error,
          isMobile: isMobileDevice(),
        },
      })
    } finally {
      refreshingRef.current = false
      isRefreshingTokenRef.current = false
    }
  }, [supabase, signOut, router, user, handleRateLimitError, handleRefreshTokenError, detectSessionInconsistency])

  // Fetch session dan setup auth listener dengan optimasi
  useEffect(() => {
    let mounted = true

    // Jika sudah ada subscription, jangan buat lagi
    if (authSubscriptionRef.current) {
      console.log("Auth subscription already exists, skipping")
      return () => {}
    }

    // Initial session check
    const initializeAuth = async () => {
      // Hindari multiple initial auth checks
      if (initialAuthCheckDoneRef.current) return
      initialAuthCheckDoneRef.current = true

      try {
        // Deteksi apakah ini perangkat mobile
        const isMobile = isMobileDevice()

        // Log initial auth check
        logAuthRequest({
          endpoint: "initializeAuth",
          method: "INTERNAL",
          source: "client",
          success: true,
          duration: 0,
          cached: false,
          details: {
            isMobile,
            action: "start",
          },
        })

        // Try to get from cache first on initial load
        const cachedSession = getCachedAuthSession()

        if (cachedSession !== undefined && mounted) {
          setSession(cachedSession)
          setUser(cachedSession?.user ?? null)
          setIsAuthenticated(!!cachedSession)
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

          // Jika token akan segera kedaluwarsa, refresh sekarang
          if (cachedSession && isTokenExpiringSoon(cachedSession)) {
            console.log("Token is expiring soon, refreshing immediately")
            refreshSession()
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

        // Log init error
        logAuthRequest({
          endpoint: "initializeAuth",
          method: "INTERNAL",
          source: "client",
          success: false,
          duration: 0,
          cached: false,
          error: error instanceof Error ? error.message : "Unknown error",
          details: {
            error,
            isMobile: isMobileDevice(),
          },
        })
      }
    }

    initializeAuth()

    // Set up auth state change listener
    try {
      const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (mounted) {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          setIsAuthenticated(!!newSession)
          setLoading(false)

          // Update cache when auth state changes
          cacheAuthSession(newSession)

          const now = Date.now()
          if (now - lastAuthStateChangeLog > AUTH_STATE_CHANGE_LOG_THROTTLE) {
            // Log auth state change
            logAuthRequest({
              endpoint: "authStateChange",
              method: "INTERNAL",
              source: "client",
              success: true,
              duration: 0,
              cached: false,
              userId: newSession?.user?.id,
              details: {
                event,
                hasSession: !!newSession,
              },
            })
            lastAuthStateChangeLog = now
          }
        }

        // If token was refreshed, update the session
        if (event === "TOKEN_REFRESHED") {
          cacheAuthSession(newSession)
          // Update last refresh time to prevent multiple refreshes
          lastRefreshTimeRef.current = Date.now()

          // Log token refresh
          logAuthRequest({
            endpoint: "tokenRefreshed",
            method: "INTERNAL",
            source: "client",
            success: true,
            duration: 0,
            cached: false,
            userId: newSession?.user?.id,
            details: {
              event,
              hasSession: !!newSession,
            },
          })
        }

        // Handle sign out
        if (event === "SIGNED_OUT") {
          clearAuthCache()
          // Reset flags
          refreshingRef.current = false
          isRefreshingTokenRef.current = false
          hasHitRateLimitRef.current = false
          authRetryCountRef.current = 0

          // Log sign out
          logAuthRequest({
            endpoint: "signedOut",
            method: "INTERNAL",
            source: "client",
            success: true,
            duration: 0,
            cached: false,
            details: {
              event,
            },
          })
        }
      })

      // Safely store the subscription for cleanup
      if (data && data.subscription && typeof data.subscription.unsubscribe === "function") {
        authSubscriptionRef.current = data.subscription
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error)
      setLoading(false)

      // Log listener error
      logAuthRequest({
        endpoint: "authListener",
        method: "INTERNAL",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          error,
        },
      })
    }

    return () => {
      mounted = false
      // Safely unsubscribe only if the subscription exists
      if (authSubscriptionRef.current) {
        try {
          authSubscriptionRef.current.unsubscribe()
          authSubscriptionRef.current = null
        } catch (error) {
          console.error("Error unsubscribing from auth listener:", error)
        }
      }
    }
  }, [supabase, refreshSession, handleRateLimitError, handleRefreshTokenError, detectSessionInconsistency])

  // Protect routes - optimasi dengan mengurangi re-renders
  useEffect(() => {
    if (!loading && !isAuthenticated && pathname?.startsWith("/dashboard")) {
      // Log redirect
      logAuthRequest({
        endpoint: "protectedRouteRedirect",
        method: "INTERNAL",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        details: {
          from: pathname,
          to: `/login?redirect=${encodeURIComponent(pathname)}`,
        },
      })

      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, loading, pathname, router])

  // Periodic session check untuk memastikan token tetap valid
  useEffect(() => {
    // Jika tidak ada sesi, tidak perlu melakukan pengecekan berkala
    if (!session) return

    // Interval yang berbeda untuk mobile dan desktop
    const checkInterval = isMobileDevice() ? 5 * 60 * 1000 : 15 * 60 * 1000 // 5 menit untuk mobile, 15 menit untuk desktop

    const intervalId = setInterval(() => {
      // Jika token akan segera kedaluwarsa, refresh
      if (session && isTokenExpiringSoon(session)) {
        console.log("Periodic check: Token is expiring soon, refreshing")
        refreshSession()
      }

      // Jika token sudah kedaluwarsa, force refresh
      if (session && isTokenExpired(session)) {
        console.warn("Periodic check: Token is expired, forcing refresh")
        refreshSession()
      }
    }, checkInterval)

    return () => clearInterval(intervalId)
  }, [session, refreshSession])

  // Deteksi ketidakkonsistenan session secara periodik
  useEffect(() => {
    // Jika tidak terautentikasi, tidak perlu melakukan pengecekan
    if (!isAuthenticated) return

    // Interval yang berbeda untuk mobile dan desktop
    const checkInterval = isMobileDevice() ? 30 * 1000 : 60 * 1000 // 30 detik untuk mobile, 60 detik untuk desktop

    const intervalId = setInterval(detectSessionInconsistency, checkInterval)

    return () => clearInterval(intervalId)
  }, [isAuthenticated, detectSessionInconsistency])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signOut,
        refreshSession,
        isAuthenticated,
        forceLogout, // Tambahkan forceLogout ke context
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
