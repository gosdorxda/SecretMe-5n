"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Send } from "lucide-react"

interface TelegramFormProps {
  userId: string
  initialTelegramChatId?: string | null
  initialNotificationChannel?: string | null
}

export function TelegramForm({ userId, initialTelegramChatId, initialNotificationChannel }: TelegramFormProps) {
  const [telegramEnabled, setTelegramEnabled] = useState(initialNotificationChannel === "telegram")
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [isConnected, setIsConnected] = useState(!!initialTelegramChatId)
  const [isTestSending, setIsTestSending] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Periksa status koneksi Telegram saat komponen dimuat
  useEffect(() => {
    if (initialTelegramChatId) {
      setIsConnected(true)
      setTelegramEnabled(initialNotificationChannel === "telegram")
    } else {
      setIsConnected(false)
      setTelegramEnabled(false)
    }
  }, [initialTelegramChatId, initialNotificationChannel])

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true)
    try {
      // Generate random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Save code to database with expiration (15 minutes)
      const { error } = await supabase.from("telegram_verification").upsert({
        user_id: userId,
        code,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })

      if (error) throw error

      setGeneratedCode(code)
      toast({
        title: "Kode Verifikasi Dibuat",
        description: "Silakan kirim kode ini ke bot Telegram kami",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat kode verifikasi",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const handleToggleNotifications = async (checked: boolean) => {
    try {
      if (!isConnected && checked) {
        // Jika belum terhubung dan mencoba mengaktifkan, tampilkan pesan error
        toast({
          title: "Telegram Belum Terhubung",
          description: "Hubungkan Telegram terlebih dahulu sebelum mengaktifkan notifikasi",
          variant: "destructive",
        })
        return
      }

      setTelegramEnabled(checked)

      // Update notification channel di database
      const { error } = await supabase
        .from("users")
        .update({
          notification_channel: checked ? "telegram" : "email",
        })
        .eq("id", userId)

      if (error) throw error

      toast({
        title: checked ? "Notifikasi Telegram Diaktifkan" : "Notifikasi Telegram Dinonaktifkan",
        description: checked
          ? "Anda akan menerima notifikasi melalui Telegram"
          : "Anda tidak akan menerima notifikasi melalui Telegram",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah pengaturan notifikasi",
        variant: "destructive",
      })
      // Kembalikan state jika gagal
      setTelegramEnabled(!checked)
    }
  }

  const handleSendTestMessage = async () => {
    setIsTestSending(true)
    try {
      const response = await fetch("/api/telegram/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          message:
            "<b>🧪 Pesan Test</b>\n\nIni adalah pesan test dari SecretMe. Jika Anda menerima pesan ini, berarti notifikasi Telegram Anda sudah berfungsi dengan baik! 🎉",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim pesan test")
      }

      toast({
        title: "Pesan Test Terkirim",
        description: "Pesan test berhasil dikirim ke Telegram Anda",
      })
    } catch (error: any) {
      toast({
        title: "Gagal Mengirim Pesan Test",
        description: error.message || "Terjadi kesalahan saat mengirim pesan test",
        variant: "destructive",
      })
    } finally {
      setIsTestSending(false)
    }
  }

  // Periksa status koneksi Telegram secara berkala jika kode verifikasi telah dibuat
  useEffect(() => {
    if (!generatedCode || isConnected) return

    const checkInterval = setInterval(async () => {
      const { data, error } = await supabase.from("users").select("telegram_chat_id").eq("id", userId).single()

      if (error) {
        console.error("Error checking Telegram connection:", error)
        return
      }

      if (data?.telegram_chat_id) {
        setIsConnected(true)
        setGeneratedCode("")
        clearInterval(checkInterval)

        toast({
          title: "Telegram Berhasil Terhubung",
          description: "Akun Telegram Anda berhasil terhubung dengan SecretMe",
        })
      }
    }, 5000) // Periksa setiap 5 detik

    return () => clearInterval(checkInterval)
  }, [generatedCode, isConnected, supabase, userId, toast])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-lg font-semibold">Notifikasi Telegram</h3>
        <p className="text-sm text-muted-foreground">Terima notifikasi pesan baru melalui Telegram</p>
      </div>

      {isConnected ? (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Telegram Terhubung</h4>
              <p className="text-sm text-green-700 mt-1">Akun Telegram Anda sudah terhubung dengan SecretMe.</p>

              {/* Tambahkan toggle untuk mengaktifkan/menonaktifkan notifikasi Telegram */}
              <div className="mt-3 flex items-center space-x-2 p-2 bg-white rounded-md border border-green-100">
                <Switch
                  id="telegram-notifications"
                  checked={telegramEnabled}
                  onCheckedChange={handleToggleNotifications}
                />
                <Label htmlFor="telegram-notifications" className="font-medium text-sm">
                  {telegramEnabled ? "Notifikasi Telegram Aktif" : "Notifikasi Telegram Nonaktif"}
                </Label>
              </div>

              <div className="mt-3">
                <p className="text-xs text-green-600 mb-2">
                  {telegramEnabled
                    ? "Anda akan menerima notifikasi pesan baru melalui Telegram."
                    : "Aktifkan untuk menerima notifikasi pesan baru melalui Telegram."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white"
                  onClick={handleSendTestMessage}
                  disabled={isTestSending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isTestSending ? "Mengirim..." : "Kirim Pesan Test"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Telegram Belum Terhubung</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Hubungkan akun Telegram Anda untuk menerima notifikasi pesan baru.
                  </p>
                </div>
              </div>

              <div className="border rounded-md p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Cara Menghubungkan Telegram:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Buka Telegram dan cari bot kami: <strong>@secretme_official_bot</strong>
                  </li>
                  <li>Klik tombol "Generate Kode" di bawah</li>
                  <li>Kirim kode tersebut ke bot Telegram</li>
                </ol>

                {generatedCode ? (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-center">
                    <p className="text-sm font-medium text-blue-700">Kode Verifikasi Anda:</p>
                    <p className="text-xl font-bold tracking-wider mt-1 text-blue-800">{generatedCode}</p>
                    <p className="text-xs mt-2 text-blue-600">Kode berlaku selama 15 menit</p>
                  </div>
                ) : (
                  <Button onClick={handleGenerateCode} disabled={isGeneratingCode} className="mt-4 w-full">
                    {isGeneratingCode ? "Membuat Kode..." : "Generate Kode"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
