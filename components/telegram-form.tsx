"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, Check, Copy, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TelegramFormProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
}

export function TelegramForm({ userId, initialTelegramId, initialTelegramNotifications }: TelegramFormProps) {
  const [telegramId, setTelegramId] = useState(initialTelegramId || "")
  const [telegramNotifications, setTelegramNotifications] = useState(initialTelegramNotifications)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [connectionCode, setConnectionCode] = useState("")
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(!!initialTelegramId)
  const [isCopied, setIsCopied] = useState(false)
  const supabase = createClient()

  // Efek untuk menetapkan status koneksi Telegram berdasarkan initialTelegramId
  useEffect(() => {
    // Jika ada initialTelegramId, anggap sudah terhubung
    setIsConnected(!!initialTelegramId && initialTelegramId.length > 0)
  }, [initialTelegramId])

  // Fungsi untuk menghasilkan kode koneksi Telegram
  async function generateConnectionCode() {
    setIsGeneratingCode(true)
    try {
      const response = await fetch("/api/telegram/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      if (data.success) {
        setConnectionCode(data.code)
        setCodeExpiry(new Date(data.expiresAt))
        toast({
          title: "Kode koneksi berhasil dibuat",
          description: "Gunakan kode ini untuk menghubungkan akun Telegram Anda",
        })
      } else {
        throw new Error(data.error || "Gagal membuat kode koneksi")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat kode koneksi",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }

  // Fungsi untuk memverifikasi koneksi Telegram
  async function verifyConnection() {
    setIsVerifying(true)
    try {
      const response = await fetch("/api/telegram/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, code: connectionCode }),
      })

      const data = await response.json()
      if (data.success) {
        setTelegramId(data.telegramId)
        setIsConnected(true)
        setConnectionCode("")
        setCodeExpiry(null)

        // Aktifkan notifikasi Telegram secara otomatis saat terhubung
        await updateTelegramNotifications(true)
        setTelegramNotifications(true)

        // Aktifkan juga notifikasi pesan baru secara otomatis
        await supabase.from("users").update({ notifications_enabled: true }).eq("id", userId)

        toast({
          title: "Berhasil",
          description: "Akun Telegram Anda berhasil terhubung dan notifikasi diaktifkan",
        })
      } else {
        throw new Error(data.error || "Verifikasi gagal. Pastikan Anda telah mengirim kode ke bot Telegram.")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memverifikasi koneksi",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Fungsi untuk memutuskan koneksi Telegram
  async function disconnectTelegram() {
    setIsDisconnecting(true)
    try {
      const response = await fetch("/api/telegram/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      if (data.success) {
        setTelegramId("")
        setIsConnected(false)
        setTelegramNotifications(false)

        // Nonaktifkan notifikasi Telegram
        await updateTelegramNotifications(false)

        toast({
          title: "Berhasil",
          description: "Akun Telegram Anda berhasil diputuskan",
        })
      } else {
        throw new Error(data.error || "Gagal memutuskan koneksi")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memutuskan koneksi",
        variant: "destructive",
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  // Fungsi untuk menyalin kode koneksi
  function copyConnectionCode() {
    navigator.clipboard.writeText(connectionCode)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Fungsi untuk mengupdate pengaturan notifikasi Telegram
  async function updateTelegramNotifications(enabled: boolean) {
    try {
      // Update telegram_notifications di tabel users
      const { error } = await supabase
        .from("users")
        .update({
          telegram_notifications: enabled,
          // Jika Telegram dinonaktifkan, nonaktifkan juga notifikasi pesan baru
          notifications_enabled: enabled ? true : false,
        })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      setTelegramNotifications(enabled)

      // Tampilkan pesan yang sesuai
      toast({
        title: "Berhasil",
        description: enabled ? "Notifikasi Telegram telah diaktifkan" : "Notifikasi Telegram telah dinonaktifkan",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pengaturan notifikasi",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk mengirim pesan uji
  async function sendTestMessage() {
    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Berhasil",
          description: "Pesan uji telah dikirim ke Telegram Anda",
        })
      } else {
        throw new Error(data.error || "Gagal mengirim pesan uji")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim pesan uji",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      {isConnected ? (
        // Tampilan jika sudah terhubung
        <div className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Terhubung</AlertTitle>
            <AlertDescription className="text-green-700">
              Akun Telegram Anda telah terhubung. Anda akan menerima notifikasi melalui Telegram.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="telegram-notifications" className="text-base">
                Notifikasi Telegram
              </Label>
              <p className="text-sm text-muted-foreground">
                Aktifkan untuk menerima notifikasi pesan baru melalui Telegram
              </p>
            </div>
            <Switch
              id="telegram-notifications"
              checked={telegramNotifications}
              onCheckedChange={(checked) => {
                updateTelegramNotifications(checked)
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={sendTestMessage} className="text-xs">
              Kirim Pesan Uji
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectTelegram}
              disabled={isDisconnecting}
              className="text-xs text-red-500 border-red-200 hover:bg-red-50"
            >
              {isDisconnecting ? "Memutuskan..." : "Putuskan Koneksi"}
            </Button>
          </div>
        </div>
      ) : (
        // Tampilan jika belum terhubung
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Belum Terhubung</AlertTitle>
            <AlertDescription>Hubungkan akun Telegram Anda untuk menerima notifikasi pesan baru.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={generateConnectionCode} disabled={isGeneratingCode}>
                {isGeneratingCode ? "Membuat Kode..." : "Buat Kode Koneksi"}
              </Button>
              <a
                href="https://t.me/SecretMeNotifBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1"
              >
                Buka Bot Telegram <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {connectionCode && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="connection-code">Kode Koneksi</Label>
                <div className="flex gap-2">
                  <Input id="connection-code" value={connectionCode} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={copyConnectionCode} className="shrink-0">
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {codeExpiry && (
                  <p className="text-xs text-muted-foreground">
                    Kode berlaku hingga:{" "}
                    {codeExpiry.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                <ol className="text-xs text-muted-foreground space-y-1 mt-2 list-decimal pl-4">
                  <li>
                    Buka bot Telegram kami di{" "}
                    <a
                      href="https://t.me/SecretMeNotifBot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      t.me/SecretMeNotifBot
                    </a>
                  </li>
                  <li>
                    Kirim pesan <code className="bg-gray-100 px-1 rounded">/start</code> ke bot
                  </li>
                  <li>Kirim kode koneksi di atas ke bot</li>
                  <li>Klik tombol "Verifikasi Koneksi" di bawah</li>
                </ol>
                <Button variant="default" onClick={verifyConnection} disabled={isVerifying} className="w-full mt-2">
                  {isVerifying ? "Memverifikasi..." : "Verifikasi Koneksi"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
