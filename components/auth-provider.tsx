"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient, signOutWithLogging } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import { logAuthRequest } from "@/lib/auth-logger"

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
      // Log signOut attempt
      logAuthRequest({
        endpoint: "signOut",
        method: "POST",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        userId: user?.id,
        details: { action: "start", provider: "AuthContext" },
      })

      // Gunakan fungsi signOut yang sudah diperbaiki
      await signOutWithLogging()

      // Update state
      setSession(null)
      setUser(null)
      setIsAuthenticated(false)

      // Redirect ke login
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)

      // Log error
      logAuthRequest({
        endpoint: "signOut",
        method: "POST",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        userId: user?.id,
        error: error instanceof Error ? error.message : String(error),
        details: { action: "error", provider: "AuthContext" },
      })

      // Jika terjadi error, tetap redirect ke login
      router.push("/login")
    }
  }, [router, user])

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

  // Fungsi refreshSession yang dioptimasi
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error)
        return
      }

      setSession(data.session)
      setUser(data.session?.user || null)
      setIsAuthenticated(!!data.session)

      // Jika token akan segera kedaluwarsa, refresh token
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
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession()

        setSession(activeSession)
        setUser(activeSession?.user || null)
        setIsAuthenticated(!!activeSession)
        setLoading(false)

        // Log session status
        logAuthRequest({
          endpoint: "getSession",
          method: "GET",
          source: "client",
          success: true,
          duration: 0,
          cached: false,
          userId: activeSession?.user?.id,
          details: {
            action: "init",
            provider: "AuthContext",
            hasSession: !!activeSession,
          },
        })
      } catch (error) {
        console.error("Error getting session:", error)
        setLoading(false)

        // Log error
        logAuthRequest({
          endpoint: "getSession",
          method: "GET",
          source: "client",
          success: false,
          duration: 0,
          cached: false,
          error: error instanceof Error ? error.message : String(error),
          details: { action: "init", provider: "AuthContext" },
        })
      }
    }

    getSession()

    // Setup listener untuk perubahan auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      // Log auth state change
      logAuthRequest({
        endpoint: "onAuthStateChange",
        method: "INTERNAL",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        userId: currentSession?.user?.id,
        details: {
          event,
          hasSession: !!currentSession,
          provider: "AuthContext",
        },
      })

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
      // Log redirect
      logAuthRequest({
        endpoint: "protectRoute",
        method: "INTERNAL",
        source: "client",
        success: true,
        duration: 0,
        cached: false,
        details: {
          action: "redirect",
          from: pathname,
          to: `/login?redirect=${encodeURIComponent(pathname)}`,
          provider: "AuthContext",
        },
      })

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
