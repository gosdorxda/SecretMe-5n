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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMobile } from "@/hooks/use-mobile"

interface TelegramFormProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
}

// Update the TelegramForm component with a cleaner UI
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
  const isMobile = useMobile()

  // Efek untuk menetapkan status koneksi Telegram berdasarkan initialTelegramId
  useEffect(() => {
    setIsConnected(!!initialTelegramId && initialTelegramId.length > 0)
  }, [initialTelegramId])

  // Efek untuk membersihkan interval saat komponen unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
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

    // Initial polling delay (start with 5 seconds instead of 3)
    let pollDelay = 5000
    // Maximum polling delay (cap at 30 seconds)
    const maxPollDelay = 30000
    // Backoff factor (multiply delay by this value each time)
    const backoffFactor = 1.5
    // Maximum number of retries before giving up
    const maxRetries = 12
    // Current retry count
    let retryCount = 0
    // Track consecutive errors
    let consecutiveErrors = 0

    // Mulai progress bar animation - slower to match longer polling
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // Jika sudah mencapai 95%, jangan tambah lagi sampai koneksi berhasil
        if (prev >= 95) return 95
        // Slower progress increment
        return prev + 0.5
      })
    }, 1000)

    // Function to schedule the next poll with exponential backoff
    const schedulePoll = () => {
      if (retryCount >= maxRetries) {
        // Stop polling after max retries
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
        setIsPolling(false)
        setError("Batas waktu koneksi terlampaui. Silakan coba lagi.")
        toast({
          title: "Timeout",
          description: "Batas waktu koneksi terlampaui. Silakan coba lagi.",
          variant: "destructive",
        })
        return
      }

      pollingIntervalRef.current = setTimeout(async () => {
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
              clearTimeout(pollingIntervalRef.current)
            }
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
            }

            setIsPolling(false)

            toast({
              title: "Berhasil",
              description: "Akun Telegram Anda berhasil terhubung dan notifikasi diaktifkan",
            })
          } else {
            // Reset consecutive errors on successful response
            consecutiveErrors = 0
            // Schedule next poll
            retryCount++
            // Apply exponential backoff
            pollDelay = Math.min(pollDelay * backoffFactor, maxPollDelay)
            schedulePoll()
          }
        } catch (error) {
          console.error("Polling error:", error)
          // Increment consecutive errors
          consecutiveErrors++

          // If we have multiple consecutive errors, increase backoff more aggressively
          if (consecutiveErrors > 2) {
            pollDelay = Math.min(pollDelay * 2, maxPollDelay)
          }

          retryCount++
          // Schedule next poll even after error, with backoff
          schedulePoll()
        }
      }, pollDelay)
    }

    // Start the polling process
    schedulePoll()
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
            Silakan kirim kode ke bot Telegram. Sistem akan memeriksa koneksi secara berkala.
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

      <Card className="neo-card overflow-hidden border-2 border-black">
        <CardHeader className="pb-3 pt-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center bg-main text-black p-1.5 rounded-lg">
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
              <CardTitle className="text-lg font-medium">Notifikasi Telegram</CardTitle>
            </div>

            {isConnected && (
              <div className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-100">
                <CheckCircle2 className="h-3 w-3" />
                <span>Terhubung</span>
              </div>
            )}
          </div>
          <CardDescription className="mt-1">
            {isConnected
              ? "Terima notifikasi pesan baru langsung ke akun Telegram Anda."
              : "Hubungkan Telegram untuk menerima notifikasi pesan baru secara instan."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          {isConnected ? (
            // Connected state UI
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="telegram-notifications" className="text-sm font-medium">
                    Notifikasi Telegram
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {telegramNotifications
                      ? "Anda akan menerima notifikasi pesan baru via Telegram"
                      : "Notifikasi Telegram saat ini dinonaktifkan"}
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

              <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-2`}>
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={sendTestMessage}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors w-full md:w-auto"
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
                  size={isMobile ? "default" : "sm"}
                  onClick={disconnectTelegram}
                  disabled={isDisconnecting}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full md:w-auto"
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
              </div>
            </div>
          ) : (
            // Not connected state UI
            <div className="space-y-4">
              {connectionStep === 0 ? (
                // Initial connection step
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-main"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </div>
                  <p className="text-sm text-center mb-4">
                    Hubungkan akun Telegram Anda untuk menerima notifikasi pesan baru secara instan.
                  </p>
                  <Button
                    variant="default"
                    onClick={generateConnectionCode}
                    disabled={isGeneratingCode}
                    className="neo-btn w-full md:w-auto text-base py-6 px-6"
                  >
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Membuat Kode...
                      </>
                    ) : (
                      <>
                        Hubungkan Telegram
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              ) : connectionStep === 1 ? (
                // Loading state
                <div className="flex flex-col items-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-main mb-3" />
                  <p className="text-sm">Membuat kode koneksi...</p>
                </div>
              ) : connectionStep === 2 ? (
                // Connection code step
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                      Menunggu Koneksi
                    </h3>
                    <p className="text-xs text-blue-700">Silakan kirim kode ke bot Telegram dan tunggu konfirmasi.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="connection-code" className="text-sm">
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
                        className="font-mono text-center text-lg tracking-wider"
                      />
                      <Button variant="outline" size="icon" onClick={copyConnectionCode} className="shrink-0">
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span>Status Koneksi</span>
                      <span>{Math.min(progress, 100)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Koneksi akan timeout setelah{" "}
                      {Math.round((12 * 5 * Math.pow(1.5, Math.min(11, Math.floor(progress / 10)))) / 60)} menit jika
                      tidak ada respons
                    </p>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                    <h4 className="text-base font-medium flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Langkah-langkah Koneksi:
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-3 list-none pl-0">
                      <li className="pb-2 flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                          1
                        </div>
                        <div>
                          <span className="font-medium block text-black">Buka bot Telegram kami</span>
                          <div className="mt-1.5">
                            <a
                              href="https://t.me/SecretMe_Alert_bot"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              t.me/SecretMe_Alert_bot
                            </a>
                          </div>
                        </div>
                      </li>
                      <li className="pb-2 flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                          2
                        </div>
                        <div>
                          <span className="font-medium block text-black">Kirim pesan</span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">/start</code> ke bot
                        </div>
                      </li>
                      <li className="pb-2 flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                          3
                        </div>
                        <div>
                          <span className="font-medium block text-black">Kirim kode koneksi</span> di atas ke bot
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                          4
                        </div>
                        <div>
                          <span className="font-medium block text-black">Tunggu konfirmasi</span> - status akan otomatis
                          diperbarui
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              ) : connectionStep === 3 ? (
                // Success state
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium text-green-700 mb-1">Berhasil Terhubung!</h3>
                  <p className="text-sm text-center text-green-600 mb-4">
                    Akun Telegram Anda telah berhasil terhubung dan siap menerima notifikasi.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
