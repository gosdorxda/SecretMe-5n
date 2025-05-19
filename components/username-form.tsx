"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"
// Tambahkan import untuk isReservedUsername
import { isReservedUsername } from "@/lib/reserved-usernames"
import { useLanguage } from "@/lib/i18n/language-context"

interface UsernameFormProps {
  userId: string
  currentUsername: string | null
}

export function UsernameForm({ userId, currentUsername }: UsernameFormProps) {
  const [username, setUsername] = useState(currentUsername || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  const { locale } = useLanguage()

  // Validasi username saat input berubah
  useEffect(() => {
    // Skip validasi jika username sama dengan yang saat ini
    if (username === currentUsername) {
      setIsAvailable(null)
      return
    }

    // Skip validasi jika username kosong
    if (!username.trim()) {
      setIsAvailable(null)
      return
    }

    // Validasi format username
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      setIsAvailable(false)
      return
    }

    // Tambahkan validasi reserved username
    if (isReservedUsername(username)) {
      setIsAvailable(false)
      return
    }

    // Debounce untuk mengurangi jumlah request ke database
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setIsChecking(true)
      try {
        // Cek apakah username sudah digunakan
        const { data: existingUser, error } = await supabase
          .from("users")
          .select("id")
          .eq("username", username)
          .neq("id", userId)
          .single()

        setIsAvailable(!existingUser)
      } catch (error) {
        console.error("Error checking username:", error)
      } finally {
        setIsChecking(false)
      }
    }, 500) // Tunggu 500ms setelah pengguna berhenti mengetik

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [username, currentUsername, userId, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!username.trim()) {
      toast({
        title: locale === "en" ? "Username cannot be empty" : "Username tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    // Validasi format username
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      toast({
        title: locale === "en" ? "Invalid username format" : "Format username tidak valid",
        description:
          locale === "en"
            ? "Username can only contain lowercase letters, numbers, underscores (_) and dashes (-)"
            : "Username hanya boleh berisi huruf kecil, angka, underscore (_) dan dash (-)",
        variant: "destructive",
      })
      return
    }

    // Tambahkan validasi reserved username
    if (isReservedUsername(username)) {
      toast({
        title: locale === "en" ? "Username not available" : "Username tidak tersedia",
        description:
          locale === "en"
            ? "This username is reserved for the system and cannot be used"
            : "Username ini dicadangkan untuk sistem dan tidak dapat digunakan",
        variant: "destructive",
      })
      return
    }

    // Jika username tidak tersedia, jangan lanjutkan
    if (isAvailable === false) {
      toast({
        title: locale === "en" ? "Username already taken" : "Username sudah digunakan",
        description: locale === "en" ? "Please choose another username" : "Silakan pilih username lain",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Cek sekali lagi apakah username sudah digunakan
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", userId)
        .single()

      if (existingUser) {
        toast({
          title: locale === "en" ? "Username already taken" : "Username sudah digunakan",
          description: locale === "en" ? "Please choose another username" : "Silakan pilih username lain",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Update username
      const { error } = await supabase
        .from("users")
        .update({ username, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) {
        throw error
      }

      toast({
        title: locale === "en" ? "Username updated" : "Username berhasil diperbarui",
        description:
          locale === "en"
            ? "Your profile link has been updated with the new username"
            : "Link profil Anda telah diperbarui dengan username baru",
      })

      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: locale === "en" ? "Failed to update username" : "Gagal memperbarui username",
        description:
          error.message ||
          (locale === "en"
            ? "An error occurred while updating username"
            : "Terjadi kesalahan saat memperbarui username"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1 sm:space-y-2">
        <Label htmlFor="username" className="text-xs sm:text-sm">
          {locale === "en" ? "Username" : "Username"}
        </Label>
        <div className="flex flex-col xs:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={locale === "en" ? "your-username" : "username-anda"}
              required
              className={`pr-10 text-xs sm:text-sm h-8 sm:h-10 ${
                isAvailable === true
                  ? "border-green-500 focus-visible:ring-green-500"
                  : isAvailable === false
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
              }`}
            />
            {isChecking ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-muted-foreground" />
              </div>
            ) : isAvailable === true ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              </div>
            ) : isAvailable === false ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </div>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={isLoading || username === currentUsername || isAvailable === false || isChecking}
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            {isLoading ? (locale === "en" ? "Saving..." : "Menyimpan...") : locale === "en" ? "Save" : "Simpan"}
          </Button>
        </div>
        <div className="text-[10px] xs:text-xs space-y-1">
          <p className="text-muted-foreground">
            {locale === "en"
              ? `Username will be used for your profile link: ${window.location.origin}/${username || "your-username"}`
              : `Username akan digunakan untuk link profil Anda: ${window.location.origin}/${username || "username-anda"}`}
          </p>
          {username && username !== currentUsername && (
            <>
              {!isChecking && isAvailable === false && (
                <p className="text-red-500">
                  {locale === "en"
                    ? "Username is already taken or invalid. Use only lowercase letters, numbers, underscores (_) and dashes (-)."
                    : "Username sudah digunakan atau tidak valid. Gunakan hanya huruf kecil, angka, underscore (_) dan dash (-)."}
                </p>
              )}
              {!isChecking && isAvailable === true && (
                <p className="text-green-500">{locale === "en" ? "Username is available!" : "Username tersedia!"}</p>
              )}
            </>
          )}
        </div>
      </div>
    </form>
  )
}
