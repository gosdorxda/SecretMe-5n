"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import { logAuthRequest } from "@/lib/auth-logger"
import { isMobileDevice } from "@/lib/auth-cache"

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
  forceLogout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
  isAuthenticated: false,
  forceLogout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Fungsi signOut yang sederhana
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setIsAuthenticated(false)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      // Jika terjadi error, tetap redirect ke login
      router.push("/login")
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

      // Bersihkan state
      setSession(null)
      setUser(null)
      setIsAuthenticated(false)

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

      // Hard redirect ke login page
      window.location.href = "/login"
    } catch (error) {
      console.error("Error during force logout:", error)
      // Jika terjadi error, tetap redirect ke login dengan hard refresh
      window.location.href = "/login"
    }
  }, [user])

  // Modify the refreshSession function to prevent excessive requests
  const lastRefreshTimeRef = useRef(0)
  const refreshSession = useCallback(async () => {
    try {
      // Add throttling to prevent excessive requests
      const now = Date.now()
      const MIN_REFRESH_INTERVAL = 60000 // 1 minute minimum between refreshes

      // Use a ref to track last refresh time

      // Skip refresh if we've refreshed recently
      if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
        return
      }

      lastRefreshTimeRef.current = now

      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error)
        return
      }

      setSession(data.session)
      setUser(data.session?.user || null)
      setIsAuthenticated(!!data.session)

      // Only refresh token if it's expiring soon and we have a session
      if (data.session && isTokenExpiringSoon(data.session)) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

        if (refreshError) {
          console.error("Error refreshing token:", refreshError)
        } else if (refreshData.session) {
          setSession(refreshData.session)
          setUser(refreshData.session.user)
        }
      }
    } catch (error) {
      console.error("Error in refreshSession:", error)
    }
  }, [supabase])

  // Fungsi untuk memeriksa apakah token akan segera kedaluwarsa
  const isTokenExpiringSoon = (session: Session) => {
    if (!session.expires_at) return false
    const expiresAt = session.expires_at * 1000 // Convert to milliseconds
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000
    return expiresAt < fiveMinutesFromNow
  }

  // Fetch session dan setup auth listener
  useEffect(() => {
    // Ambil session saat komponen dimount
    const getSession = async () => {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession()
      setSession(activeSession)
      setUser(activeSession?.user || null)
      setIsAuthenticated(!!activeSession)
      setLoading(false)
    }

    getSession()

    // Setup listener untuk perubahan auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user || null)
      setIsAuthenticated(!!currentSession)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Protect routes
  useEffect(() => {
    if (!loading && !isAuthenticated && pathname?.startsWith("/dashboard")) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, loading, pathname, router])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signOut,
        refreshSession,
        isAuthenticated,
        forceLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
