"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { toast } = useToast()

  // Check if we have a valid reset token
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking session:", error)
          toast({
            title: "Error saat memeriksa sesi",
            description: "Terjadi kesalahan saat memeriksa sesi Anda",
            variant: "destructive",
          })
          router.push("/forgot-password")
          return
        }

        // If no session and no code parameter, redirect to forgot-password
        if (!data.session && !searchParams.get("code")) {
          toast({
            title: "Link tidak valid",
            description: "Link reset password tidak valid atau telah kedaluwarsa",
            variant: "destructive",
          })
          router.push("/forgot-password")
        }
      } catch (error) {
        console.error("Unexpected error checking session:", error)
        toast({
          title: "Error tidak terduga",
          description: "Terjadi kesalahan saat memeriksa sesi Anda",
          variant: "destructive",
        })
        router.push("/forgot-password")
      }
    }

    checkSession()
  }, [router, searchParams, supabase.auth, toast])

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    // Length check
    if (password.length >= 8) strength += 1
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1
    // Contains number
    if (/[0-9]/.test(password)) strength += 1
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    setPasswordStrength(strength)
  }, [password])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Password tidak cocok",
        description: "Password dan konfirmasi password harus sama",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Password terlalu pendek",
        description: "Password harus minimal 8 karakter",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw error
      }

      // Show success message
      setIsSuccess(true)
      toast({
        title: "Password berhasil diubah",
        description: "Password Anda telah berhasil diubah",
      })
    } catch (error: any) {
      console.error("Error resetting password:", error)
      toast({
        title: "Gagal mengubah password",
        description: error.message || "Terjadi kesalahan saat mengubah password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500"
    if (passwordStrength <= 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength <= 2) return "Lemah"
    if (passwordStrength <= 3) return "Sedang"
    return "Kuat"
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-4rem)] py-4 bg-[var(--bg)]">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-gray-600">Buat password baru untuk akun Anda</p>
        </div>

        <div className="bg-white p-4 rounded-md border-2 border-black">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Password Berhasil Diubah!</h2>
              <p className="text-gray-600 mb-6">
                Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.
              </p>
              <Button asChild className="w-full neo-btn">
                <Link href="/login">Login Sekarang</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{getStrengthText()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 border-2 border-black rounded-md focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Password tidak cocok</p>
                )}
              </div>

              <div className="pt-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Password yang kuat harus:</h3>
                  <ul className="text-xs text-blue-700 space-y-1 pl-5 list-disc">
                    <li>Minimal 8 karakter</li>
                    <li>Mengandung huruf besar dan kecil</li>
                    <li>Mengandung angka</li>
                    <li>Mengandung karakter khusus (misalnya: !@#$%^&*)</li>
                  </ul>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full neo-btn">
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                    Memproses...
                  </>
                ) : (
                  "Ubah Password"
                )}
              </Button>
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
