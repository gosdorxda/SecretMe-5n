"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { isValidTelegramId } from "@/lib/telegram/config"

interface TelegramFormProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
}

export function TelegramForm({ userId, initialTelegramId, initialTelegramNotifications }: TelegramFormProps) {
  const [telegramId, setTelegramId] = useState(initialTelegramId || "")
  const [telegramNotifications, setTelegramNotifications] = useState(initialTelegramNotifications)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [actualVerificationCode, setActualVerificationCode] = useState("")
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const supabase = createClient()

  const handleVerifyTelegram = async () => {
    if (!telegramId) {
      toast({
        title: "Error",
        description: "Telegram ID tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    if (!isValidTelegramId(telegramId)) {
      toast({
        title: "Error",
        description: "Format Telegram ID tidak valid. Gunakan ID numerik dari bot.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setDebugInfo(null)

    try {
      // Send verification code via Telegram
      const response = await fetch("/api/telegram/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegramId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Error ${response.status}`)
      }

      // In a real app, the verification code should not be returned to the client
      // This is just for demonstration purposes
      setActualVerificationCode(data.verificationCode)
      setVerificationSent(true)

      toast({
        title: "Kode Verifikasi Terkirim",
        description: "Silakan cek Telegram Anda untuk kode verifikasi",
      })
    } catch (error: any) {
      console.error("Error sending verification code:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim kode verifikasi",
        variant: "destructive",
      })
      setDebugInfo(`Error: ${error.message || "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode !== actualVerificationCode) {
      toast({
        title: "Error",
        description: "Kode verifikasi tidak valid",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Save Telegram ID to database
      const response = await fetch("/api/telegram/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegramId,
          enableNotifications: telegramNotifications,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Error ${response.status}`)
      }

      toast({
        title: "Berhasil",
        description: "Telegram ID berhasil disimpan",
      })

      // Reset verification state
      setVerificationSent(false)
      setVerificationCode("")
      setActualVerificationCode("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan Telegram ID",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleNotifications = async (checked: boolean) => {
    setTelegramNotifications(checked)

    // Jika sudah ada Telegram ID yang terverifikasi, langsung update preferensi
    if (initialTelegramId) {
      try {
        const response = await fetch("/api/telegram/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegramId: initialTelegramId,
            enableNotifications: checked,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data?.error || `Error ${response.status}`)
        }

        toast({
          title: "Berhasil",
          description: `Notifikasi Telegram ${checked ? "diaktifkan" : "dinonaktifkan"}`,
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Gagal mengubah pengaturan notifikasi",
          variant: "destructive",
        })
        // Revert state if failed
        setTelegramNotifications(!checked)
      }
    }
  }

  // Fungsi untuk mengirim pesan test
  const handleSendTestMessage = async () => {
    if (!initialTelegramId) {
      toast({
        title: "Error",
        description: "Anda belum memiliki Telegram ID yang terverifikasi",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setDebugInfo(null)

    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Error ${response.status}`)
      }

      toast({
        title: "Pesan Test Terkirim",
        description: "Silakan cek Telegram Anda untuk pesan test",
      })
    } catch (error: any) {
      console.error("Error sending test message:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim pesan test",
        variant: "destructive",
      })
      setDebugInfo(`Error: ${error.message || "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="telegram_id">Telegram ID</Label>
        <div className="flex space-x-2">
          <Input
            id="telegram_id"
            placeholder="Masukkan Telegram ID Anda"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            disabled={isSubmitting || (verificationSent && !initialTelegramId)}
          />
          {!verificationSent && !initialTelegramId && (
            <Button onClick={handleVerifyTelegram} disabled={isSubmitting}>
              Verifikasi
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Untuk mendapatkan Telegram ID, chat dengan bot @SecretMeBot dan kirim pesan /start
        </p>
      </div>

      {verificationSent && !initialTelegramId && (
        <div className="space-y-2">
          <Label htmlFor="verification_code">Kode Verifikasi</Label>
          <div className="flex space-x-2">
            <Input
              id="verification_code"
              placeholder="Masukkan kode 6 digit"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={isSubmitting}
            />
            <Button onClick={handleVerifyCode} disabled={isSubmitting}>
              Verifikasi
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Masukkan kode verifikasi yang dikirim ke Telegram Anda</p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="telegram_notifications"
          checked={telegramNotifications}
          onCheckedChange={handleToggleNotifications}
          disabled={!initialTelegramId && !verificationSent}
        />
        <Label htmlFor="telegram_notifications">Aktifkan notifikasi Telegram</Label>
      </div>

      {/* Tombol untuk mengirim pesan test */}
      {initialTelegramId && (
        <div className="pt-4">
          <Button variant="outline" onClick={handleSendTestMessage} disabled={isSubmitting}>
            Kirim Pesan Test
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Gunakan tombol ini untuk menguji apakah notifikasi Telegram berfungsi
          </p>
        </div>
      )}

      {/* Debug info */}
      {debugInfo && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs font-mono break-all">{debugInfo}</p>
        </div>
      )}
    </div>
  )
}
