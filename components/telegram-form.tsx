"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, Copy } from "lucide-react"

interface TelegramFormProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
}

export function TelegramForm({ userId, initialTelegramId, initialTelegramNotifications }: TelegramFormProps) {
  const [telegramNotifications, setTelegramNotifications] = useState(initialTelegramNotifications)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [connectionCode, setConnectionCode] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(!!initialTelegramId)
  const [isPolling, setIsPolling] = useState(false)
  const [pollingInterval, setPollingIntervalState] = useState<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Fungsi untuk menghasilkan kode koneksi
  const generateConnectionCode = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/telegram/generate-code", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Error ${response.status}`)
      }

      setConnectionCode(data.connectionCode)

      // Mulai polling untuk memeriksa status koneksi
      startPolling()

      toast({
        title: "Kode koneksi berhasil dibuat",
        description: "Silakan kirim kode ini ke bot Telegram @SecretMeBot",
      })
    } catch (error: any) {
      console.error("Error generating connection code:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal membuat kode koneksi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fungsi untuk memeriksa status koneksi
  const checkConnectionStatus = async () => {
    try {
      const response = await fetch("/api/telegram/check-connection", {
        method: "GET",
      })

      const data = await response.json()

      if (response.ok && data.success && data.isConnected) {
        setIsConnected(true)
        setConnectionCode(null)
        stopPolling()

        // Refresh halaman untuk mendapatkan data terbaru
        window.location.reload()
      }
    } catch (error) {
      console.error("Error checking connection status:", error)
    }
  }

  // Fungsi untuk memulai polling
  const startPolling = () => {
    setIsPolling(true)
    const interval = setInterval(checkConnectionStatus, 3000) // Periksa setiap 3 detik
    setPollingIntervalState(interval)
  }

  // Fungsi untuk menghentikan polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingIntervalState(null)
    }
    setIsPolling(false)
  }

  // Hentikan polling saat komponen unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

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
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fungsi untuk menyalin kode ke clipboard
  const copyCodeToClipboard = () => {
    if (connectionCode) {
      navigator.clipboard.writeText(connectionCode)
      toast({
        title: "Kode disalin",
        description: "Kode koneksi telah disalin ke clipboard",
      })
    }
  }

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <div className="space-y-4">
          {!connectionCode ? (
            <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="mb-4 text-center">
                <h4 className="font-medium text-blue-800 mb-2">Hubungkan dengan Telegram</h4>
                <p className="text-sm text-blue-600 mb-4">Dapatkan notifikasi pesan baru langsung ke Telegram Anda</p>
              </div>
              <Button onClick={generateConnectionCode} disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Memproses...
                  </>
                ) : (
                  "Hubungkan ke Telegram"
                )}
              </Button>
              <div className="mt-4 text-xs text-blue-600">
                <p>Langkah-langkah:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Klik tombol di atas untuk mendapatkan kode koneksi</li>
                  <li>Buka Telegram dan cari @SecretMeBot</li>
                  <li>Kirim pesan /start ke bot</li>
                  <li>Kirim kode koneksi ke bot</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="mb-4 text-center">
                <h4 className="font-medium text-blue-800 mb-2">Kirim Kode ke Bot Telegram</h4>
                <p className="text-sm text-blue-600 mb-1">Buka Telegram dan kirim kode berikut ke @SecretMeBot:</p>
              </div>

              <div className="flex items-center gap-2 bg-white p-3 rounded-md border border-blue-200 w-full max-w-xs mb-4">
                <code className="flex-1 text-center font-mono text-lg font-bold text-blue-700">{connectionCode}</code>
                <Button variant="ghost" size="icon" onClick={copyCodeToClipboard} className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {isPolling && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-blue-600"></span>
                  <span>Menunggu koneksi...</span>
                </div>
              )}

              <div className="mt-4 text-xs text-blue-600">
                <p className="font-medium">Langkah-langkah:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Buka Telegram dan cari @SecretMeBot</li>
                  <li>Kirim pesan /start ke bot</li>
                  <li>Kirim kode di atas ke bot</li>
                  <li>Halaman ini akan otomatis diperbarui setelah koneksi berhasil</li>
                </ol>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setConnectionCode(null)
                  stopPolling()
                }}
                className="mt-4"
                size="sm"
              >
                Batalkan
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm text-green-700">Akun Telegram berhasil terhubung</span>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="telegram_notifications"
              checked={telegramNotifications}
              onCheckedChange={handleToggleNotifications}
            />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="telegram_notifications" className="text-sm font-medium leading-none">
                Aktifkan notifikasi Telegram
              </label>
              <p className="text-xs text-muted-foreground">Terima notifikasi pesan baru melalui Telegram</p>
            </div>
          </div>

          <div className="pt-4">
            <Button variant="outline" onClick={handleSendTestMessage} disabled={isSubmitting}>
              Kirim Pesan Test
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Gunakan tombol ini untuk menguji apakah notifikasi Telegram berfungsi
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
