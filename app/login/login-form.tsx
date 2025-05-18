"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { logAuthRequest } from "@/lib/auth-logger"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const redirect = searchParams.get("redirect") || "/dashboard"
  const errorMessage = searchParams.get("message")
  const supabase = createClient()
  const { toast } = useToast()

  // Check for session errors
  useEffect(() => {
    if (error === "session_expired" || error === "auth_error") {
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      })

      // Log session error
      logAuthRequest({
        endpoint: "loginForm",
        method: "GET",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        error: error,
        details: { errorMessage },
      })
    }
  }, [error, errorMessage, toast])

  // Check for callback errors
  useEffect(() => {
    if (error) {
      console.error("❌ LOGIN: Error from callback:", error, errorMessage)

      let displayMessage = "Terjadi kesalahan saat proses autentikasi"

      // Display more specific error messages based on error code
      if (error === "auth_callback_error") {
        displayMessage = "Terjadi kesalahan saat autentikasi dengan provider"
      } else if (error === "database_error") {
        displayMessage = "Terjadi kesalahan saat mengakses database"
      } else if (error === "user_creation_failed") {
        displayMessage = "Gagal membuat data pengguna. Silakan coba lagi"
      } else if (error === "no_code_parameter") {
        displayMessage = "Parameter autentikasi tidak ditemukan"
      } else if (error === "no_session_after_exchange") {
        displayMessage = "Sesi tidak dapat dibuat setelah autentikasi"
      } else if (error === "no_session_data") {
        displayMessage = "Data sesi tidak ditemukan setelah autentikasi"
      } else if (error === "session_error") {
        displayMessage = "Terjadi kesalahan saat memverifikasi sesi"
      } else if (error === "set_session_error") {
        displayMessage = "Terjadi kesalahan saat menyimpan sesi"
      } else if (error === "persistent_session_issue") {
        displayMessage = "Masalah persisten dengan sesi autentikasi"
      } else if (error === "unexpected_error") {
        displayMessage = "Terjadi kesalahan yang tidak terduga"
      }

      // Add specific error message if available
      if (errorMessage) {
        displayMessage += `: ${errorMessage}`
      }

      toast({
        title: "Login gagal",
        description: displayMessage,
        variant: "destructive",
      })

      // Log callback error
      logAuthRequest({
        endpoint: "loginCallback",
        method: "GET",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        error: error,
        details: { errorMessage, displayMessage },
      })
    }
  }, [error, errorMessage, toast])

  // Fungsi untuk menangani error login
  const handleLoginError = (error: any) => {
    console.error("❌ LOGIN: Login failed:", error)

    // Increment login attempts
    const newAttempts = loginAttempts + 1
    setLoginAttempts(newAttempts)

    // Log login error
    logAuthRequest({
      endpoint: "login",
      method: "POST",
      source: "client",
      success: false,
      duration: 0,
      cached: false,
      error: error.message || "Unknown error",
      details: {
        attempts: newAttempts,
        errorCode: error.code,
        errorStatus: error.status,
      },
    })

    // Customize error message based on error type
    let errorMessage = error.message || "Email atau password salah"

    // Handle specific error cases
    if (error.message?.includes("Invalid login credentials")) {
      errorMessage = "Email atau password salah"
    } else if (error.message?.includes("rate limit")) {
      errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti."
    } else if (error.message?.includes("network")) {
      errorMessage = "Masalah koneksi internet. Periksa koneksi Anda dan coba lagi."
    }

    // Add attempt count for multiple failures
    if (newAttempts > 1) {
      errorMessage += ` (Percobaan ke-${newAttempts})`
    }

    toast({
      title: "Login gagal",
      description: errorMessage,
      variant: "destructive",
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    console.log("🔍 LOGIN: Starting email login")

    // Log login attempt
    logAuthRequest({
      endpoint: "login",
      method: "POST",
      source: "client",
      success: true,
      duration: 0,
      cached: false,
      details: {
        method: "email",
        attempts: loginAttempts,
        action: "start",
      },
    })

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      console.log("🔍 LOGIN: Authenticating with email/password")
      const startTime = performance.now()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      const duration = performance.now() - startTime

      if (error) {
        console.error("❌ LOGIN: Authentication error:", error)

        // Log auth error
        logAuthRequest({
          endpoint: "login",
          method: "POST",
          source: "client",
          success: false,
          duration,
          cached: false,
          error: error.message,
          details: {
            method: "email",
            errorCode: error.code,
            errorStatus: error.status,
          },
        })

        throw error
      }

      console.log("✅ LOGIN: Authentication successful, checking user in database")

      // Log auth success
      logAuthRequest({
        endpoint: "login",
        method: "POST",
        source: "client",
        success: true,
        duration,
        cached: false,
        userId: data.user.id,
        details: {
          method: "email",
          action: "authenticated",
        },
      })

      // Check if user exists in database
      const dbStartTime = performance.now()
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single()
      const dbDuration = performance.now() - dbStartTime

      if (userError) {
        console.log("🔍 LOGIN: User check error:", userError)

        // Log db error
        logAuthRequest({
          endpoint: "loginDbCheck",
          method: "GET",
          source: "client",
          success: false,
          duration: dbDuration,
          cached: false,
          userId: data.user.id,
          error: userError.message,
          details: {
            errorCode: userError.code,
            action: "checkUser",
          },
        })

        // If user not found in database, create a new record
        if (userError.code === "PGRST116") {
          console.log("🔍 LOGIN: User not found in database, creating new record")

          // Log create user start
          logAuthRequest({
            endpoint: "loginCreateUser",
            method: "POST",
            source: "client",
            success: true,
            duration: 0,
            cached: false,
            userId: data.user.id,
            details: {
              action: "start",
            },
          })

          const createStartTime = performance.now()
          const { error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            name: data.user.user_metadata.full_name || data.user.user_metadata.name || email.split("@")[0] || "User",
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_premium: false,
          })
          const createDuration = performance.now() - createStartTime

          if (insertError) {
            console.error("❌ LOGIN: Failed to create user record:", insertError)

            // Log create user error
            logAuthRequest({
              endpoint: "loginCreateUser",
              method: "POST",
              source: "client",
              success: false,
              duration: createDuration,
              cached: false,
              userId: data.user.id,
              error: insertError.message,
              details: {
                errorCode: insertError.code,
              },
            })

            throw new Error("Gagal membuat data pengguna")
          }

          console.log("✅ LOGIN: User record created successfully")

          // Log create user success
          logAuthRequest({
            endpoint: "loginCreateUser",
            method: "POST",
            source: "client",
            success: true,
            duration: createDuration,
            cached: false,
            userId: data.user.id,
            details: {
              action: "complete",
            },
          })
        } else {
          console.error("❌ LOGIN: Database error:", userError)
          throw userError
        }
      } else {
        console.log("✅ LOGIN: User exists in database")

        // Log db check success
        logAuthRequest({
          endpoint: "loginDbCheck",
          method: "GET",
          source: "client",
          success: true,
          duration: dbDuration,
          cached: false,
          userId: data.user.id,
          details: {
            action: "userExists",
          },
        })
      }

      toast({
        title: "Login berhasil",
        description: "Selamat datang kembali!",
      })

      // Reset login attempts on success
      setLoginAttempts(0)

      // Log login success
      logAuthRequest({
        endpoint: "login",
        method: "POST",
        source: "client",
        success: true,
        duration: performance.now() - startTime,
        cached: false,
        userId: data.user.id,
        details: {
          method: "email",
          action: "complete",
          redirect,
        },
      })

      // Redirect to dashboard or requested page
      console.log("✅ LOGIN: Redirecting to:", redirect)
      router.push(redirect)
      router.refresh()
    } catch (error: any) {
      handleLoginError(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    console.log("🔍 LOGIN: Starting Google login")

    // Log Google login attempt
    logAuthRequest({
      endpoint: "login",
      method: "POST",
      source: "client",
      success: true,
      duration: 0,
      cached: false,
      details: {
        method: "google",
        action: "start",
      },
    })

    try {
      // Use the environment variable instead of window.location.origin
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = `${appUrl}/auth/callback?redirect_to=${encodeURIComponent(redirect)}`
      console.log("🔍 LOGIN: Google OAuth redirect URL:", redirectUrl)

      const startTime = performance.now()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })
      const duration = performance.now() - startTime

      if (error) {
        console.error("❌ LOGIN: Google OAuth error:", error)

        // Log Google login error
        logAuthRequest({
          endpoint: "login",
          method: "POST",
          source: "client",
          success: false,
          duration,
          cached: false,
          error: error.message,
          details: {
            method: "google",
            errorCode: error.code,
            errorStatus: error.status,
          },
        })

        throw error
      }

      console.log("✅ LOGIN: Google OAuth initiated, URL:", data?.url)

      // Log Google login success
      logAuthRequest({
        endpoint: "login",
        method: "POST",
        source: "client",
        success: true,
        duration,
        cached: false,
        details: {
          method: "google",
          action: "redirecting",
          redirectUrl: data?.url ? true : false,
        },
      })

      // No need to redirect manually, Supabase will handle it
    } catch (error: any) {
      console.error("❌ LOGIN: Google login failed:", error)

      // Log Google login error
      logAuthRequest({
        endpoint: "login",
        method: "POST",
        source: "client",
        success: false,
        duration: 0,
        cached: false,
        error: error.message || "Unknown error",
        details: {
          method: "google",
          errorCode: error.code,
          errorStatus: error.status,
        },
      })

      toast({
        title: "Login dengan Google gagal",
        description: error.message || "Terjadi kesalahan saat login dengan Google",
        variant: "destructive",
      })
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 bg-[var(--bg)]">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">Masuk untuk melanjutkan</h1>
          <p className="text-gray-600">Lanjutkan perjalanan komunikasi anonim Anda</p>
        </div>

        <div className="bg-white p-4 rounded-md border-2 border-black">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Terjadi kesalahan saat login</p>
                <p className="text-xs text-red-700 mt-1">
                  {error === "no_session_after_exchange" && (
                    <>
                      Sesi tidak dapat dibuat setelah autentikasi. Ini mungkin disebabkan oleh masalah cookie atau
                      pengaturan browser Anda. Coba:
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Pastikan cookie diaktifkan di browser Anda</li>
                        <li>Coba gunakan browser lain</li>
                        <li>Coba login dengan email dan password</li>
                      </ul>
                      <Link href="/auth/debug" className="text-red-800 underline block mt-2">
                        Lihat detail debug
                      </Link>
                    </>
                  )}
                  {error !== "no_session_after_exchange" && (errorMessage || "Silakan coba lagi")}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 text-sm mb-4">
              <AlertDescription>
                Karena limit API, pendaftaran via Google dimatikan sementara, silahkan daftar secara manual.
              </AlertDescription>
            </Alert>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="email@example.com"
                className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
                  Lupa password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={isLoading} className="w-full neo-btn" aria-live="polite">
              {isLoading ? "Memproses..." : "Login"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Kesulitan masuk?{" "}
              <Link href="/forgot-password" className="font-medium text-black hover:underline">
                Reset password Anda
              </Link>
            </p>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ATAU</span>
            </div>
          </div>

          {/* Tombol Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={true}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 border-2 border-gray-300 text-gray-500 font-medium py-2.5 px-4 rounded-md cursor-not-allowed opacity-70"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                />
              </g>
            </svg>
            {isGoogleLoading ? "Memproses..." : "Masuk dengan Google"}
          </button>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p>
            <Link href="/forgot-password" className="text-gray-600 hover:underline">
              Lupa Password?
            </Link>
          </p>
          <p>
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-black hover:underline">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
