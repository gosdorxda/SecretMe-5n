"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/lib/i18n/language-context"

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  const supabase = createClient()
  const { toast } = useToast()
  const { t, locale } = useLanguage()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      // Periksa apakah email sudah terdaftar
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      // Jika email sudah terdaftar, tampilkan pesan error
      if (existingUser) {
        // Coba periksa apakah email ini ada di Auth
        try {
          // Coba login dengan email/password untuk memeriksa apakah user ada di Auth
          // Ini akan gagal jika user tidak ada di Auth
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError && signInError.message.includes("Invalid login credentials")) {
            // User ada di database tapi tidak ada di Auth
            // Tampilkan pesan yang lebih informatif
            toast({
              title: t.register.registerError,
              description: t.register.emailExistsAuthError,
              variant: "destructive",
            })
          } else {
            // User ada di database dan di Auth
            toast({
              title: t.register.registerError,
              description: t.register.emailExistsError,
              variant: "destructive",
            })
          }
        } catch (error) {
          // Jika terjadi error lain, tampilkan pesan umum
          toast({
            title: t.register.registerError,
            description: t.register.emailExistsError,
            variant: "destructive",
          })
        }

        setIsLoading(false)
        return
      }

      // Daftarkan user dengan Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        throw error
      }

      // Tambahkan user ke tabel users
      if (data.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          name,
          email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_premium: false,
          allow_public_replies: false, // Set default ke false untuk pengguna baru
        })

        if (profileError) {
          throw profileError
        }
      }

      // Langsung login setelah pendaftaran berhasil
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      toast({
        title: t.register.registerSuccess,
        description: t.register.registerSuccessMessage,
      })

      // Redirect ke halaman dashboard
      router.push(redirect)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: t.register.registerError,
        description: error.message || t.register.networkError,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Perbarui fungsi handleGoogleSignup untuk meneruskan parameter redirect
  async function handleGoogleSignup() {
    setIsGoogleLoading(true)
    try {
      // Use the environment variable instead of window.location.origin
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = `${appUrl}/auth/callback?redirect_to=${encodeURIComponent(redirect)}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: t.register.registerError,
        description: error.message || t.register.networkError,
        variant: "destructive",
      })
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 bg-[var(--bg)]">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">{t.register.title}</h1>
          <p className="text-gray-600">{t.register.subtitle}</p>
        </div>

        <div className="bg-white p-4 rounded-md border-2 border-black">
          <form onSubmit={onSubmit} className="space-y-6">
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 text-sm mb-4">
              <AlertDescription>{t.register.googleDisabledMessage}</AlertDescription>
            </Alert>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                {t.register.nameLabel}
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder={t.register.namePlaceholder}
                className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t.register.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder={t.register.emailPlaceholder}
                className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t.register.passwordLabel}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder={t.register.passwordPlaceholder}
                className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
              />
            </div>

            <button type="submit" disabled={isLoading} className="w-full neo-btn">
              {isLoading ? t.register.processingButton : t.register.registerButton}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t.register.orDivider}</span>
            </div>
          </div>

          {/* Tombol Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
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
            {isGoogleLoading ? t.register.googleProcessingButton : t.register.googleButton}
          </button>
        </div>

        <div className="text-center mt-6">
          <p>
            {t.register.haveAccount}{" "}
            <Link href={`/${locale === "en" ? "en/" : ""}login`} className="font-medium text-black hover:underline">
              {t.register.loginLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
