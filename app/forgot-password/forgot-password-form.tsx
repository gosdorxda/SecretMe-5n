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
import { useTranslation } from "react-i18next"

export default function ForgotPasswordForm() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Ubah fungsi handleSubmit untuk memeriksa apakah email terdaftar
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: t("auth.errors.emailRequired"),
        description: "Silakan masukkan alamat email Anda",
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
          title: t("auth.errors.emailNotFound"),
          description: "Alamat email yang Anda masukkan tidak terdaftar di sistem kami",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Kirim email reset password melalui Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      // Tampilkan pesan sukses
      setIsSuccess(true)
      toast({
        title: t("auth.forgotPassword.emailSent"),
        description: t("auth.forgotPassword.emailSentDesc"),
      })
    } catch (error: any) {
      console.error("Error sending reset email:", error)
      toast({
        title: "Gagal mengirim email reset",
        description: error.message || t("auth.errors.unknownError"),
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
          <h1 className="text-3xl font-bold mb-2">{t("auth.forgotPassword.title")}</h1>
          <p className="text-gray-600">{t("auth.forgotPassword.subtitle")}</p>
        </div>

        <div className="bg-white p-4 rounded-md border-2 border-black">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{t("auth.forgotPassword.emailSent")}</h2>
              <p className="text-gray-600 mb-6">{t("auth.forgotPassword.emailSentDesc")}</p>
              <p className="text-sm text-gray-500 mb-4">{t("auth.forgotPassword.checkSpam")}</p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full neo-btn-outline">
                  {t("auth.forgotPassword.tryAgain")}
                </Button>
                <Button asChild className="w-full neo-btn">
                  <Link href="/login">{t("auth.forgotPassword.backToLoginButton")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  {t("auth.forgotPassword.emailLabel")}
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.forgotPassword.emailPlaceholder")}
                  required
                  className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full neo-btn">
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                    {t("auth.forgotPassword.processingButton")}
                  </>
                ) : (
                  t("auth.forgotPassword.submitButton")
                )}
              </Button>

              <div className="pt-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">{t("auth.forgotPassword.infoText")}</p>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  )
}
