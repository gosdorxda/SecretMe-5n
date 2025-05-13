"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, Check, Copy, ExternalLink, Loader2, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"

// Alias export for compatibility
export const useMobile = useIsMobile

interface TelegramFormProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
}

// Update the TelegramForm component with a manual verification approach
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
  const [error, setError] = useState<string | null>(null)
  const [connectionStep, setConnectionStep] = useState(0)
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const supabase = createClient()
  const isMobile = useIsMobile()

  // Efek untuk menetapkan status koneksi Telegram berdasarkan initialTelegramId
  useEffect(() => {
    setIsConnected(!!initialTelegramId && initialTelegramId.length > 0)
  }, [initialTelegramId])

  // Fungsi untuk menghasilkan kode koneksi Telegram
  async function generateConnectionCode() {
    setIsGeneratingCode(true)
    setError(null)
    setConnectionStep(1)
    setVerificationAttempts(0)

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

  // Fungsi untuk memverifikasi koneksi Telegram secara manual
  async function verifyConnection() {
    setIsVerifying(true)
    setError(null)
    setVerificationAttempts((prev) => prev + 1)

    try {
      const response = await fetch("/api/telegram/poll-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: connectionCode }),
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

        toast({
          title: "Berhasil",
          description: "Akun Telegram Anda berhasil terhubung dan notifikasi diaktifkan",
        })
      } else {
        // Koneksi belum berhasil
        toast({
          title: "Belum terhubung",
          description: "Bot Telegram belum menerima kode Anda. Pastikan Anda telah mengirim kode dengan benar.",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error("Verification error:", error)
      setError(error.message || "Gagal memverifikasi koneksi")
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
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Menunggu Verifikasi</AlertTitle>
          <AlertDescription className="text-blue-700">
            Silakan kirim kode ke bot Telegram, lalu klik tombol "Verifikasi Koneksi".
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

  // Fungsi untuk menampilkan pesan bantuan berdasarkan jumlah percobaan verifikasi
  const getVerificationHelpMessage = () => {
    if (verificationAttempts === 0) {
      return "Klik tombol verifikasi setelah mengirim kode ke bot."
    } else if (verificationAttempts === 1) {
      return "Pastikan Anda telah mengirim kode dengan benar ke bot."
    } else if (verificationAttempts === 2) {
      return "Coba mulai bot dengan mengirim /start terlebih dahulu."
    } else if (verificationAttempts >= 3) {
      return "Pastikan Anda menggunakan bot yang benar: @SecretMe_Alert_bot"
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
                // Connection code step with manual verification
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1.5">
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
                        className="text-blue-600"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Langkah 1: Kirim Kode ke Bot
                    </h3>
                    <p className="text-xs text-blue-700">
                      Kirim kode di bawah ke bot Telegram, lalu klik tombol "Verifikasi Koneksi".
                    </p>
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

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                    <h3 className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1.5">
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
                        className="text-amber-600"
                      >
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                      </svg>
                      Langkah 2: Verifikasi Koneksi
                    </h3>
                    <p className="text-xs text-amber-700 mb-3">{getVerificationHelpMessage()}</p>
                    <Button
                      variant="default"
                      onClick={verifyConnection}
                      disabled={isVerifying}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memverifikasi...
                        </>
                      ) : (
                        <>
                          Verifikasi Koneksi
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
                            className="ml-2"
                          >
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        </>
                      )}
                    </Button>
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
                      Petunjuk Koneksi:
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
                          <span className="font-medium block text-black">Klik tombol "Verifikasi Koneksi"</span> untuk
                          menyelesaikan proses
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
