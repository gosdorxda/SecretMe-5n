"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { isValidIndonesianPhoneNumber, formatPhoneNumber } from "@/lib/fonnte/config"

interface WhatsAppFormProps {
  userId: string
  initialPhoneNumber: string | null
  initialWhatsAppNotifications: boolean
}

export function WhatsAppForm({ userId, initialPhoneNumber, initialWhatsAppNotifications }: WhatsAppFormProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "")
  const [whatsAppNotifications, setWhatsAppNotifications] = useState(initialWhatsAppNotifications)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [actualVerificationCode, setActualVerificationCode] = useState("")
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const supabase = createClient()

  const handleSavePhoneNumber = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Nomor WhatsApp tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    if (!isValidIndonesianPhoneNumber(phoneNumber)) {
      toast({
        title: "Error",
        description: "Format nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxx atau +628xxxxxxxxx",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setDebugInfo(null)

    try {
      // Generate random 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      setActualVerificationCode(code)

      console.log("Mengirim kode verifikasi ke:", phoneNumber)
      console.log("Kode:", code)

      // Send verification code via WhatsApp
      const response = await fetch("/api/whatsapp/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formatPhoneNumber(phoneNumber),
          code,
        }),
      })

      const responseText = await response.text()
      console.log("Response status:", response.status)
      console.log("Response text:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        setDebugInfo(`Response bukan JSON valid: ${responseText}`)
        throw new Error("Response bukan JSON valid")
      }

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Error ${response.status}: ${JSON.stringify(data)}`)
      }

      setVerificationSent(true)
      toast({
        title: "Kode Verifikasi Terkirim",
        description: "Silakan cek WhatsApp Anda untuk kode verifikasi",
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
      // Save phone number to database
      const { error } = await supabase
        .from("users")
        .update({
          phone_number: formatPhoneNumber(phoneNumber),
          whatsapp_notifications,
          notification_channel: whatsAppNotifications ? "whatsapp" : "email",
        })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Berhasil",
        description: "Nomor WhatsApp berhasil disimpan",
      })

      // Reset verification state
      setVerificationSent(false)
      setVerificationCode("")
      setActualVerificationCode("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan nomor WhatsApp",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleNotifications = async (checked: boolean) => {
    setWhatsAppNotifications(checked)

    // Jika sudah ada nomor telepon yang terverifikasi, langsung update preferensi
    if (initialPhoneNumber) {
      try {
        const { error } = await supabase
          .from("users")
          .update({
            whatsapp_notifications: checked,
            notification_channel: checked ? "whatsapp" : "email",
          })
          .eq("id", userId)

        if (error) {
          throw new Error(error.message)
        }

        toast({
          title: "Berhasil",
          description: `Notifikasi WhatsApp ${checked ? "diaktifkan" : "dinonaktifkan"}`,
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Gagal mengubah pengaturan notifikasi",
          variant: "destructive",
        })
        // Revert state if failed
        setWhatsAppNotifications(!checked)
      }
    }
  }

  // Fungsi untuk mengirim pesan test
  const handleSendTestMessage = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Nomor WhatsApp tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setDebugInfo(null)

    try {
      const response = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formatPhoneNumber(phoneNumber),
        }),
      })

      const responseText = await response.text()
      console.log("Test message response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        setDebugInfo(`Response bukan JSON valid: ${responseText}`)
        throw new Error("Response bukan JSON valid")
      }

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Error ${response.status}: ${JSON.stringify(data)}`)
      }

      toast({
        title: "Pesan Test Terkirim",
        description: "Silakan cek WhatsApp Anda untuk pesan test",
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
        <Label htmlFor="phone_number">Nomor WhatsApp</Label>
        <div className="flex space-x-2">
          <Input
            id="phone_number"
            placeholder="08xxxxxxxxx"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isSubmitting || (verificationSent && !initialPhoneNumber)}
          />
          {!verificationSent && !initialPhoneNumber && (
            <Button onClick={handleSavePhoneNumber} disabled={isSubmitting}>
              Verifikasi
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Masukkan nomor WhatsApp Anda untuk menerima notifikasi pesan baru
        </p>
      </div>

      {verificationSent && !initialPhoneNumber && (
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
          <p className="text-sm text-muted-foreground">Masukkan kode verifikasi yang dikirim ke WhatsApp Anda</p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="whatsapp_notifications"
          checked={whatsAppNotifications}
          onCheckedChange={handleToggleNotifications}
          disabled={!initialPhoneNumber && !verificationSent}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="whatsapp_notifications" className="text-sm font-medium leading-none">
            Aktifkan notifikasi WhatsApp
          </Label>
          <p className="text-xs text-muted-foreground">Terima notifikasi pesan baru melalui WhatsApp</p>
        </div>
      </div>

      {/* Tombol untuk mengirim pesan test */}
      <div className="pt-4">
        <Button variant="outline" onClick={handleSendTestMessage} disabled={isSubmitting || !phoneNumber}>
          Kirim Pesan Test
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Gunakan tombol ini untuk menguji apakah notifikasi WhatsApp berfungsi
        </p>
      </div>

      {/* Debug info */}
      {debugInfo && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs font-mono break-all">{debugInfo}</p>
        </div>
      )}
    </div>
  )
}
