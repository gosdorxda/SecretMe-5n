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

export default function ForgotPasswordForm() {
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
        title: "Email diperlukan",
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
          title: "Email tidak terdaftar",
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
        title: "Email terkirim",
        description: "Silakan periksa email Anda untuk instruksi reset password",
      })
    } catch (error: any) {
      console.error("Error sending reset email:", error)
      toast({
        title: "Gagal mengirim email reset",
        description: error.message || "Terjadi kesalahan saat mengirim email reset password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex items-center justify-center min-h-screen py-8 bg-[var(--bg)]">
      <div className="w-full max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Lupa Password</h1>
          <p className="text-gray-600">Masukkan email Anda untuk menerima link reset password</p>
        </div>

        <div className="bg-white p-8 rounded-md border-2 border-black">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Email Terkirim!</h2>
              <p className="text-gray-600 mb-6">
                Kami telah mengirimkan instruksi reset password ke email Anda. Silakan periksa kotak masuk Anda.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Tidak menerima email? Periksa folder spam atau coba lagi dalam beberapa menit.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => setIsSuccess(false)} variant="outline" className="w-full neo-btn-outline">
                  Coba Lagi
                </Button>
                <Button asChild className="w-full neo-btn">
                  <Link href="/login">Kembali ke Login</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full neo-btn">
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                    Mengirim...
                  </>
                ) : (
                  "Kirim Link Reset"
                )}
              </Button>

              <div className="pt-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    Kami akan mengirimkan link reset password ke alamat email yang terdaftar di sistem kami.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  )
}
