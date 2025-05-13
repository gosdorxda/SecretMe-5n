"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Bell,
  Link,
  Link2OffIcon as LinkOff,
  Send,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [isSendingTest, setIsSendingTest] = useState(false)
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
    setIsSendingTest(true)

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
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="p-4 animate-in fade-in-50 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isConnected ? (
        // Tampilan jika sudah terhubung
        <Card className="mt-4 overflow-hidden border-2 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-4 pt-4 relative bg-gradient-to-r from-blue-50 to-white">
            <div className="absolute top-3 right-3">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-600 border border-green-200 flex items-center gap-1 px-2 py-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Terhubung</span>
              </Badge>
            </div>

            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-500 text-white p-1.5 rounded-lg">
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
              Terima notifikasi pesan baru langsung ke akun Telegram Anda secara real-time.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 mb-4 flex items-start gap-3">
              <div className="mt-1 text-blue-500">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-1">Status Notifikasi</h4>
                <p className="text-xs text-blue-600">
                  {telegramNotifications
                    ? "Notifikasi Telegram aktif. Anda akan menerima pemberitahuan saat ada pesan baru."
                    : "Notifikasi Telegram tidak aktif. Aktifkan untuk menerima pemberitahuan pesan baru."}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="telegram-notifications" className="text-base font-medium">
                    Notifikasi Telegram
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {telegramNotifications ? "Notifikasi aktif untuk pesan baru" : "Aktifkan untuk menerima notifikasi"}
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        id="telegram-notifications"
                        checked={telegramNotifications}
                        onCheckedChange={(checked) => {
                          updateTelegramNotifications(checked)
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{telegramNotifications ? "Nonaktifkan notifikasi" : "Aktifkan notifikasi"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between pt-4 border-t bg-gray-50 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestMessage}
              disabled={isSendingTest}
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Kirim Pesan Uji
                </>
              )}
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
                  <LinkOff className="mr-1.5 h-3.5 w-3.5" />
                  Putuskan Koneksi
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        // Tampilan jika belum terhubung
        <Card className="mt-4 overflow-hidden border-2 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="pb-4 pt-4 bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="flex items-center justify-center bg-blue-500 text-white p-1.5 rounded-lg">
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
              Terima notifikasi pesan baru langsung ke akun Telegram Anda secara real-time.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {connectionStep === 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
                <div className="mt-1 text-blue-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Aktifkan Notifikasi Telegram</h4>
                  <p className="text-xs text-blue-600">
                    Hubungkan akun Telegram Anda untuk menerima notifikasi instan saat ada pesan baru. Tidak perlu
                    membuka aplikasi untuk tetap update!
                  </p>
                </div>
              </div>
            )}

            {connectionStep === 0 && (
              <Button
                variant="default"
                onClick={generateConnectionCode}
                disabled={isGeneratingCode}
                className="w-full bg-blue-500 hover:bg-blue-600 transition-all transform hover:-translate-y-0.5"
              >
                {isGeneratingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat Kode...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Hubungkan Telegram
                  </>
                )}
              </Button>
            )}

            {connectionStep === 1 && (
              <div className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                  <p className="text-sm font-medium">Membuat kode koneksi...</p>
                  <p className="text-xs text-gray-500 mt-1">Mohon tunggu sebentar</p>
                </div>
              </div>
            )}

            {connectionStep === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="connection-code" className="text-sm font-medium">
                      Kode Koneksi
                    </Label>
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
                      className="font-mono text-center text-lg tracking-wider bg-gray-50"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={copyConnectionCode} className="shrink-0">
                            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isCopied ? "Disalin!" : "Salin kode"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Status Koneksi</Label>
                    <span className="text-xs text-blue-500 animate-pulse">Menunggu koneksi...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="rounded-lg border bg-white p-4 space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">
                      1
                    </span>
                    <span>Buka bot Telegram kami</span>
                  </h4>
                  <div className="pl-7">
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

                  <h4 className="text-sm font-medium flex items-center gap-1.5 pt-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">
                      2
                    </span>
                    <span>Kirim pesan ke bot</span>
                  </h4>
                  <div className="pl-7">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">/start</code>
                  </div>

                  <h4 className="text-sm font-medium flex items-center gap-1.5 pt-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">
                      3
                    </span>
                    <span>Kirim kode koneksi</span>
                  </h4>
                  <div className="pl-7">
                    <p className="text-xs text-gray-600">Kirim kode koneksi di atas ke bot</p>
                  </div>

                  <h4 className="text-sm font-medium flex items-center gap-1.5 pt-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">
                      4
                    </span>
                    <span>Tunggu konfirmasi</span>
                  </h4>
                  <div className="pl-7">
                    <p className="text-xs text-gray-600">Status akan otomatis diperbarui saat terhubung</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
