"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, Check, Copy, ExternalLink, Loader2, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TelegramFormProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
}

export function TelegramForm({ userId, initialTelegramId, initialTelegramNotifications }: TelegramFormProps) {
  const [telegramId, setTelegramId] = useState(initialTelegramId || "")
  const [telegramNotifications, setTelegramNotifications] = useState(initialTelegramNotifications)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [connectionCode, setConnectionCode] = useState("")
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(!!initialTelegramId)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [connectionStep, setConnectionStep] = useState(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Efek untuk menetapkan status koneksi Telegram berdasarkan initialTelegramId
  useEffect(() => {
    setIsConnected(!!initialTelegramId && initialTelegramId.length > 0)
  }, [initialTelegramId])

  // Efek untuk membersihkan interval saat komponen unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Fungsi untuk menghasilkan kode koneksi Telegram
  async function generateConnectionCode() {
    setIsGeneratingCode(true)
    setError(null)
    setConnectionStep(1)

    try {
      const response = await fetch("/api/telegram/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        setConnectionCode(data.code)
        setCodeExpiry(new Date(data.expiresAt))
        setConnectionStep(2)
        startPolling(data.code)
        toast({
          title: "Kode koneksi berhasil dibuat",
          description: "Gunakan kode ini untuk menghubungkan akun Telegram Anda",
        })
      } else {
        throw new Error(data.error || "Gagal membuat kode koneksi")
      }
    } catch (error: any) {
      console.error("Error generating code:", error)
      setError(error.message || "Gagal membuat kode koneksi")
      toast({
        title: "Error",
        description: error.message || "Gagal membuat kode koneksi",
        variant: "destructive",
      })
      setConnectionStep(0)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  // Fungsi untuk memulai polling status koneksi
  function startPolling(code: string) {
    setIsPolling(true)
    setProgress(0)

    // Mulai progress bar animation
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // Jika sudah mencapai 95%, jangan tambah lagi sampai koneksi berhasil
        if (prev >= 95) return 95
        return prev + 1
      })
    }, 1000)

    // Mulai polling untuk memeriksa status koneksi
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch("/api/telegram/poll-connection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          throw new Error("Gagal memeriksa status koneksi")
        }

        const data = await response.json()

        if (data.success && data.connected) {
          // Koneksi berhasil
          setTelegramId(data.telegramId)
          setIsConnected(true)
          setConnectionCode("")
          setCodeExpiry(null)
          setTelegramNotifications(data.telegramNotifications)
          setConnectionStep(3)
          setProgress(100)

          // Hentikan polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          setIsPolling(false)

          toast({
            title: "Berhasil",
            description: "Akun Telegram Anda berhasil terhubung dan notifikasi diaktifkan",
          })
        }
      } catch (error) {
        console.error("Polling error:", error)
      }
    }, 3000) // Periksa setiap 3 detik
  }

  // Fungsi untuk memutuskan koneksi Telegram
  async function disconnectTelegram() {
    setIsDisconnecting(true)
    setError(null)

    try {
      const response = await fetch("/api/telegram/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      if (data.success) {
        setTelegramId("")
        setIsConnected(false)
        setTelegramNotifications(false)
        setConnectionStep(0)

        toast({
          title: "Berhasil",
          description: "Akun Telegram Anda berhasil diputuskan",
        })
      } else {
        throw new Error(data.error || "Gagal memutuskan koneksi")
      }
    } catch (error: any) {
      console.error("Error disconnecting:", error)
      setError(error.message || "Gagal memutuskan koneksi")
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
        })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      setTelegramNotifications(enabled)

      toast({
        title: "Berhasil",
        description: enabled ? "Notifikasi Telegram telah diaktifkan" : "Notifikasi Telegram telah dinonaktifkan",
      })
    } catch (error: any) {
      console.error("Error updating notifications:", error)
      setError(error.message || "Gagal memperbarui pengaturan notifikasi")
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pengaturan notifikasi",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk mengirim pesan uji
  async function sendTestMessage() {
    setError(null)
    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} ${errorText}`)
      }

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
      console.error("Error sending test message:", error)
      setError(error.message || "Gagal mengirim pesan uji")
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim pesan uji",
        variant: "destructive",
      })
    }
  }

  // Render status koneksi berdasarkan langkah
  const renderConnectionStatus = () => {
    if (connectionStep === 0) {
      return (
        <Alert className="p-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Belum Terhubung</AlertTitle>
          <AlertDescription>Hubungkan akun Telegram Anda untuk menerima notifikasi pesan baru.</AlertDescription>
        </Alert>
      )
    } else if (connectionStep === 1) {
      return (
        <Alert className="p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Membuat Kode Koneksi</AlertTitle>
          <AlertDescription>Mohon tunggu sebentar...</AlertDescription>
        </Alert>
      )
    } else if (connectionStep === 2) {
      return (
        <Alert className="bg-blue-50 border-blue-200 p-4">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertTitle className="text-blue-800">Menunggu Koneksi</AlertTitle>
          <AlertDescription className="text-blue-700">
            Silakan kirim kode ke bot Telegram dan tunggu konfirmasi.
          </AlertDescription>
        </Alert>
      )
    } else if (connectionStep === 3) {
      return (
        <Alert className="bg-green-50 border-green-200 p-4">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Terhubung</AlertTitle>
          <AlertDescription className="text-green-700">Akun Telegram Anda berhasil terhubung.</AlertDescription>
        </Alert>
      )
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="p-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isConnected ? (
        // Tampilan jika sudah terhubung
        <Card className="mt-4">
          <CardHeader className="pb-4 pt-4 relative">
            <div className="absolute top-3 right-3 bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-100">
              <CheckCircle2 className="h-3 w-3" />
              <span>Aktif</span>
            </div>

            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-50 text-blue-500 p-1.5 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </div>
              <span>Notifikasi Telegram</span>
            </CardTitle>
            <CardDescription>
              Akun Telegram Anda telah terhubung dan siap menerima notifikasi pesan baru.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            <div className="p-4 bg-gray-50 rounded-lg border mb-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="telegram-notifications" className="text-base font-medium">
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-4 mt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestMessage}
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1.5 text-blue-500"
              >
                <path d="m3 3 3 9-3 9 19-9Z" />
                <path d="M6 12h16" />
              </svg>
              Kirim Pesan Uji
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectTelegram}
              disabled={isDisconnecting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Memutuskan...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1.5 text-red-500"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  Putuskan Koneksi
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        // Tampilan jika belum terhubung
        <Card className="mt-4">
          <CardHeader className="pb-4 pt-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-50 text-blue-500 p-1.5 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </div>
              <span>Notifikasi Telegram</span>
            </CardTitle>
            <CardDescription>Terima notifikasi pesan baru langsung ke akun Telegram Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderConnectionStatus()}

            {connectionStep === 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  onClick={generateConnectionCode}
                  disabled={isGeneratingCode}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  {isGeneratingCode ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Membuat Kode...
                    </>
                  ) : (
                    <>
                      Hubungkan Telegram
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {connectionStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="connection-code">Kode Koneksi</Label>
                    {codeExpiry && (
                      <span className="text-xs text-muted-foreground">
                        Berlaku hingga:{" "}
                        {codeExpiry.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="connection-code"
                      value={connectionCode}
                      readOnly
                      className="font-mono text-center text-lg tracking-wider"
                    />
                    <Button variant="outline" size="icon" onClick={copyConnectionCode} className="shrink-0">
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status Koneksi</Label>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">
                    {isPolling ? "Menunggu koneksi dari Telegram..." : "Siap terhubung"}
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <h4 className="text-sm font-medium">Langkah-langkah Koneksi:</h4>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4">
                    <li className="pb-1">
                      <span className="font-medium">Buka bot Telegram kami</span>
                      <div className="mt-1">
                        <a
                          href="https://t.me/SecretMeNotifBot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          t.me/SecretMeNotifBot
                        </a>
                      </div>
                    </li>
                    <li className="pb-1">
                      <span className="font-medium">Kirim pesan</span>{" "}
                      <code className="bg-gray-100 px-1 rounded">/start</code> ke bot
                    </li>
                    <li className="pb-1">
                      <span className="font-medium">Kirim kode koneksi</span> di atas ke bot
                    </li>
                    <li>
                      <span className="font-medium">Tunggu konfirmasi</span> - status akan otomatis diperbarui
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
