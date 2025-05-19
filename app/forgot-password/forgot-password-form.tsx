"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, ArrowLeft, Mail } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { t, locale } = useLanguage()

  // Ubah fungsi handleSubmit untuk memeriksa apakah email terdaftar
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: t.forgotPassword.emailRequired,
        description: t.forgotPassword.emailRequired,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Periksa apakah email terdaftar di database
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle()

      if (!user) {
        toast({
          title: t.forgotPassword.emailNotRegistered,
          description: t.forgotPassword.emailNotRegistered,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Kirim email reset password melalui Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale === "en" ? "en/" : ""}reset-password`,
      })

      if (error) {
        throw error
      }

      // Tampilkan pesan sukses
      setIsSuccess(true)
      toast({
        title: t.forgotPassword.resetEmailSent,
        description: t.forgotPassword.resetEmailSentMessage,
      })
    } catch (error: any) {
      console.error("Error sending reset email:", error)
      toast({
        title: t.forgotPassword.resetEmailError,
        description: error.message || t.forgotPassword.resetEmailErrorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 bg-[var(--bg)]">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">{t.forgotPassword.title}</h1>
          <p className="text-gray-600">{t.forgotPassword.subtitle}</p>
        </div>

        <div className="bg-white p-4 rounded-md border-2 border-black">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{t.forgotPassword.successTitle}</h2>
              <p className="text-gray-600 mb-6">{t.forgotPassword.successMessage}</p>
              <p className="text-sm text-gray-500 mb-4">{t.forgotPassword.checkSpam}</p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full neo-btn-outline">
                  {t.forgotPassword.tryAgainButton}
                </Button>
                <Button asChild className="w-full neo-btn">
                  <Link href={`/${locale === "en" ? "en/" : ""}login`}>{t.forgotPassword.backToLoginButton}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t.forgotPassword.emailLabel}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.forgotPassword.emailPlaceholder}
                  required
                  className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full neo-btn">
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                    {t.forgotPassword.processingButton}
                  </>
                ) : (
                  t.forgotPassword.submitButton
                )}
              </Button>

              <div className="pt-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">{t.forgotPassword.infoMessage}</p>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            href={`/${locale === "en" ? "en/" : ""}login`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.forgotPassword.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  )
}
