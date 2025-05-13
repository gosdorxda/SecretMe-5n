"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, AlertCircle, Send, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function TelegramForm({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionCode, setConnectionCode] = useState("")
  const [telegramId, setTelegramId] = useState("")
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [telegramUsername, setTelegramUsername] = useState("")
  const { toast } = useToast()
  const supabase = createClient()

  // Periksa status koneksi Telegram saat komponen dimuat
  useEffect(() => {
    checkTelegramConnection()

    return () => {
      // Bersihkan interval polling saat komponen unmount
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [])

  // Fungsi untuk memeriksa status koneksi Telegram
  async function checkTelegramConnection() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/telegram/check-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to check Telegram connection")
      }

      const data = await response.json()

      if (data.connected) {
        setIsConnected(true)
        setTelegramId(data.telegramId || "")
        setTelegramUsername(data.telegramUsername || "")
      } else {
        setIsConnected(false)
        setTelegramId("")
        setTelegramUsername("")
      }
    } catch (error) {
      console.error("Error checking Telegram connection:", error)
      toast({
        title: "Error",
        description: "Gagal memeriksa koneksi Telegram",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk menghasilkan kode koneksi Telegram
  async function generateConnectionCode() {
    try {
      setIsGeneratingCode(true)
      const response = await fetch("/api/telegram/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate connection code")
      }

      const data = await response.json()
      setConnectionCode(data.code)

      // Mulai polling untuk memeriksa status koneksi
      startPolling()

      toast({
        title: "Kode koneksi berhasil dibuat",
        description: "Kirim kode ini ke bot Telegram @SecretMeBot",
      })
    } catch (error) {
      console.error("Error generating connection code:", error)
      toast({
        title: "Error",
        description: "Gagal membuat kode koneksi",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }

  // Fungsi untuk memulai polling status koneksi
  function startPolling() {
    setIsPolling(true)
    // Bersihkan interval sebelumnya jika ada
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // Polling setiap 3 detik
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/telegram/poll-connection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, code: connectionCode }),
        })

        if (!response.ok) {
          throw new Error("Failed to poll connection status")
        }

        const data = await response.json()

        if (data.connected) {
          // Koneksi berhasil
          setIsConnected(true)
          setTelegramId(data.telegramId || "")
          setTelegramUsername(data.telegramUsername || "")
          setIsPolling(false)
          clearInterval(interval)
          setPollingInterval(null)

          toast({
            title: "Koneksi berhasil",
            description: "Akun Telegram Anda berhasil terhubung",
          })
        }
      } catch (error) {
        console.error("Error polling connection status:", error)
      }
    }, 3000)

    setPollingInterval(interval)

    // Hentikan polling setelah 2 menit jika tidak ada koneksi
    setTimeout(() => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
        setIsPolling(false)
        toast({
          title: "Timeout",
          description: "Waktu koneksi habis. Silakan coba lagi.",
          variant: "destructive",
        })
      }
    }, 120000)
  }

  // Fungsi untuk memutuskan koneksi Telegram
  async function disconnectTelegram() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/telegram/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to disconnect Telegram")
      }

      setIsConnected(false)
      setTelegramId("")
      setTelegramUsername("")
      setConnectionCode("")

      toast({
        title: "Koneksi diputus",
        description: "Akun Telegram Anda berhasil diputus",
      })
    } catch (error) {
      console.error("Error disconnecting Telegram:", error)
      toast({
        title: "Error",
        description: "Gagal memutuskan koneksi Telegram",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk mengirim pesan test
  async function sendTestMessage() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to send test message")
      }

      toast({
        title: "Pesan test terkirim",
        description: "Pesan test berhasil dikirim ke Telegram Anda",
      })
    } catch (error) {
      console.error("Error sending test message:", error)
      toast({
        title: "Error",
        description: "Gagal mengirim pesan test",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-md border-2 border-gray-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Send className="h-5 w-5" />
          Notifikasi Telegram
        </CardTitle>
        <CardDescription>Dapatkan notifikasi langsung di Telegram saat ada pesan baru</CardDescription>
      </CardHeader>

      <CardContent className="pt-6 pb-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Memuat status koneksi...</span>
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Telegram terhubung</p>
                <p className="text-sm text-green-700">
                  {telegramUsername ? `@${telegramUsername}` : `ID: ${telegramId}`}
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Anda akan menerima notifikasi di Telegram saat ada pesan baru. Pastikan Anda tidak memblokir bot
                @SecretMeBot.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {connectionCode ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <span className="block h-5 w-5 text-center font-bold text-blue-700">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Buka Telegram dan cari @SecretMeBot</p>
                    <p className="text-sm text-blue-700">Mulai chat dengan bot dan kirim perintah /start</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <span className="block h-5 w-5 text-center font-bold text-blue-700">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Kirim kode koneksi berikut ke bot</p>
                    <div className="mt-2 flex items-center">
                      <code className="bg-white px-3 py-1.5 rounded border border-blue-300 font-mono text-lg tracking-wider">
                        {connectionCode}
                      </code>
                      <button
                        type="button"
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          navigator.clipboard.writeText(connectionCode)
                          toast({
                            title: "Kode disalin",
                            description: "Kode koneksi telah disalin ke clipboard",
                          })
                        }}
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                </div>

                {isPolling && (
                  <div className="flex items-center justify-center gap-2 py-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Menunggu koneksi...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800">Telegram belum terhubung</p>
                    <p className="text-sm text-yellow-700">
                      Hubungkan akun Telegram Anda untuk mendapatkan notifikasi pesan baru
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    Dengan menghubungkan Telegram, Anda akan mendapatkan notifikasi instan saat ada pesan baru. Klik
                    tombol di bawah untuk mendapatkan kode koneksi.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-2 pb-4">
        {isConnected ? (
          <>
            <Button
              variant="outline"
              onClick={sendTestMessage}
              disabled={isLoading}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Kirim Test
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={disconnectTelegram}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Putuskan Koneksi"
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={generateConnectionCode}
            disabled={isGeneratingCode || isPolling}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGeneratingCode ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat Kode...
              </>
            ) : connectionCode ? (
              "Buat Kode Baru"
            ) : (
              "Hubungkan Telegram"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
