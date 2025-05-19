"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, Send, Link, Copy, ExternalLink, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

interface TelegramFormProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
  locale?: "id" | "en"
}

export function TelegramForm({
  userId,
  initialTelegramId,
  initialTelegramNotifications,
  locale = "id",
}: TelegramFormProps) {
  const [telegramId, setTelegramId] = useState<string | null>(initialTelegramId)
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialTelegramNotifications)
  const [connectionCode, setConnectionCode] = useState<string | null>(null)
  const [connectionStep, setConnectionStep] = useState(telegramId ? 2 : 0)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const supabase = createClient()

  // Fungsi untuk menghasilkan kode koneksi
  async function generateConnectionCode() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/telegram/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate connection code")
      }

      setConnectionCode(data.code)
      setConnectionStep(1)
      toast({
        title: locale === "en" ? "Connection code created" : "Kode koneksi berhasil dibuat",
        description:
          locale === "en"
            ? "Use this code to connect your Telegram account"
            : "Gunakan kode ini untuk menghubungkan akun Telegram Anda",
      })
    } catch (error: any) {
      console.error("Error generating connection code:", error)
      toast({
        title: locale === "en" ? "Error" : "Terjadi Kesalahan",
        description:
          error.message || (locale === "en" ? "Failed to generate connection code" : "Gagal membuat kode koneksi"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk memverifikasi koneksi
  async function verifyConnection() {
    setIsVerifying(true)
    setVerificationAttempts((prev) => prev + 1)

    try {
      const response = await fetch("/api/telegram/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, code: connectionCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      if (data.telegramId) {
        setTelegramId(data.telegramId)
        setConnectionStep(2)
        setNotificationsEnabled(true)
        toast({
          title: locale === "en" ? "Telegram connected" : "Telegram berhasil terhubung",
          description:
            locale === "en"
              ? "Your Telegram account is now connected for notifications"
              : "Akun Telegram Anda sekarang terhubung untuk notifikasi",
        })
      } else {
        throw new Error(locale === "en" ? "No Telegram ID found" : "ID Telegram tidak ditemukan")
      }
    } catch (error: any) {
      console.error("Error verifying connection:", error)
      toast({
        title: locale === "en" ? "Verification failed" : "Verifikasi gagal",
        description:
          error.message ||
          (locale === "en"
            ? "Could not verify your Telegram connection"
            : "Tidak dapat memverifikasi koneksi Telegram Anda"),
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  // Fungsi untuk memutuskan koneksi
  async function disconnectTelegram() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/telegram/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to disconnect")
      }

      setTelegramId(null)
      setConnectionStep(0)
      setConnectionCode(null)
      setNotificationsEnabled(false)
      toast({
        title: locale === "en" ? "Telegram disconnected" : "Telegram berhasil diputuskan",
        description:
          locale === "en" ? "Your Telegram account has been disconnected" : "Akun Telegram Anda telah diputuskan",
      })
    } catch (error: any) {
      console.error("Error disconnecting Telegram:", error)
      toast({
        title: locale === "en" ? "Error" : "Terjadi Kesalahan",
        description: error.message || (locale === "en" ? "Failed to disconnect Telegram" : "Gagal memutuskan Telegram"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk mengirim pesan uji
  async function sendTestMessage() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test message")
      }

      toast({
        title: locale === "en" ? "Test message sent" : "Pesan uji terkirim",
        description:
          locale === "en"
            ? "Check your Telegram for the test notification"
            : "Periksa Telegram Anda untuk notifikasi uji",
      })
    } catch (error: any) {
      console.error("Error sending test message:", error)
      toast({
        title: locale === "en" ? "Error" : "Terjadi Kesalahan",
        description: error.message || (locale === "en" ? "Failed to send test message" : "Gagal mengirim pesan uji"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk menyalin kode ke clipboard
  function copyCodeToClipboard() {
    if (connectionCode) {
      navigator.clipboard.writeText(connectionCode)
      toast({
        title: locale === "en" ? "Code copied" : "Kode disalin",
        description: locale === "en" ? "Connection code copied to clipboard" : "Kode koneksi disalin ke clipboard",
      })
    }
  }

  // Fungsi untuk mengubah status notifikasi
  async function toggleNotifications(enabled: boolean) {
    try {
      const { error } = await supabase.from("profiles").update({ telegram_notifications: enabled }).eq("id", userId)

      if (error) throw error

      setNotificationsEnabled(enabled)
      toast({
        title: enabled
          ? locale === "en"
            ? "Notifications enabled"
            : "Notifikasi diaktifkan"
          : locale === "en"
            ? "Notifications disabled"
            : "Notifikasi dinonaktifkan",
        description: enabled
          ? locale === "en"
            ? "You will now receive Telegram notifications"
            : "Anda akan menerima notifikasi Telegram"
          : locale === "en"
            ? "You will no longer receive Telegram notifications"
            : "Anda tidak akan menerima notifikasi Telegram",
      })
    } catch (error: any) {
      console.error("Error updating notification settings:", error)
      toast({
        title: locale === "en" ? "Error" : "Terjadi Kesalahan",
        description:
          error.message ||
          (locale === "en" ? "Failed to update notification settings" : "Gagal memperbarui pengaturan notifikasi"),
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk mendapatkan pesan bantuan verifikasi
  const getVerificationHelpMessage = () => {
    if (verificationAttempts === 0) {
      return locale === "en"
        ? "Click the verification button after sending the code to the bot."
        : "Klik tombol verifikasi setelah mengirim kode ke bot."
    } else if (verificationAttempts === 1) {
      return locale === "en"
        ? "Make sure you've sent the code correctly to the bot."
        : "Pastikan Anda telah mengirim kode dengan benar ke bot."
    } else if (verificationAttempts === 2) {
      return locale === "en"
        ? "Try sending the code again and then verify."
        : "Coba kirim kode lagi dan kemudian verifikasi."
    } else {
      return locale === "en"
        ? "If you're still having issues, try generating a new code."
        : "Jika Anda masih mengalami masalah, coba buat kode baru."
    }
  }

  // Fungsi untuk menampilkan status koneksi
  const renderConnectionStatus = () => {
    if (connectionStep === 0) {
      return (
        <Alert className="p-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{locale === "en" ? "Not Connected" : "Belum Terhubung"}</AlertTitle>
          <AlertDescription>
            {locale === "en"
              ? "Connect your Telegram account to receive new message notifications."
              : "Hubungkan akun Telegram Anda untuk menerima notifikasi pesan baru."}
          </AlertDescription>
        </Alert>
      )
    } else if (connectionStep === 1) {
      return (
        <Alert className="p-4 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-700">
            {locale === "en" ? "Pending Connection" : "Koneksi Tertunda"}
          </AlertTitle>
          <AlertDescription className="text-yellow-600">
            {locale === "en"
              ? "Follow the instructions below to complete your Telegram connection."
              : "Ikuti petunjuk di bawah untuk menyelesaikan koneksi Telegram Anda."}
          </AlertDescription>
        </Alert>
      )
    } else {
      return (
        <Alert className="p-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">{locale === "en" ? "Connected" : "Terhubung"}</AlertTitle>
          <AlertDescription className="text-green-600">
            {locale === "en"
              ? "Your Telegram account is connected and ready to receive notifications."
              : "Akun Telegram Anda terhubung dan siap menerima notifikasi."}
          </AlertDescription>
        </Alert>
      )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-500" />
          {locale === "en" ? "Telegram Notifications" : "Notifikasi Telegram"}
        </CardTitle>
        <CardDescription>
          {locale === "en"
            ? "Receive new message notifications directly to your Telegram"
            : "Terima notifikasi pesan baru langsung ke Telegram Anda"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderConnectionStatus()}

        {connectionStep === 2 && (
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="telegram-notifications" className="text-base">
                {locale === "en" ? "Enable Notifications" : "Aktifkan Notifikasi"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {locale === "en"
                  ? "Get notified when you receive new messages"
                  : "Dapatkan pemberitahuan saat ada pesan baru"}
              </p>
            </div>
            <Switch
              id="telegram-notifications"
              checked={notificationsEnabled}
              onCheckedChange={toggleNotifications}
              disabled={!telegramId}
            />
          </div>
        )}

        {connectionStep === 1 && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h4 className="text-base font-medium flex items-center gap-1.5">
                {locale === "en" ? "Connection Instructions:" : "Petunjuk Koneksi:"}
              </h4>
              <ol className="text-sm text-muted-foreground space-y-3 list-none pl-0">
                <li className="pb-2 flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-medium block text-black">
                      {locale === "en" ? "Open our Telegram bot" : "Buka bot Telegram kami"}
                    </span>
                    <a
                      href="https://t.me/SecretMeNotifBot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>@SecretMeNotifBot</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </li>
                <li className="pb-2 flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-medium block text-black">
                      {locale === "en" ? "Start the bot" : "Mulai bot"}
                    </span>
                    <span className="text-gray-600">
                      {locale === "en" ? "Send the /start command to the bot" : "Kirim perintah /start ke bot"}
                    </span>
                  </div>
                </li>
                <li className="pb-2 flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-medium block text-black">
                      {locale === "en" ? "Send your connection code" : "Kirim kode koneksi Anda"}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <Input value={connectionCode || ""} readOnly className="bg-white text-sm font-mono" />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={copyCodeToClipboard}
                        title={locale === "en" ? "Copy code" : "Salin kode"}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 mt-0.5">
                    4
                  </div>
                  <div>
                    <span className="font-medium block text-black">
                      {locale === "en" ? "Verify your connection" : "Verifikasi koneksi Anda"}
                    </span>
                    <span className="text-gray-600">{getVerificationHelpMessage()}</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {connectionStep === 2 && (
          <>
            <Button variant="outline" onClick={sendTestMessage} disabled={isLoading || !telegramId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === "en" ? "Sending..." : "Mengirim..."}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {locale === "en" ? "Send Test Message" : "Kirim Pesan Uji"}
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={disconnectTelegram} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locale === "en" ? "Disconnecting..." : "Memutuskan..."}
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  {locale === "en" ? "Disconnect" : "Putuskan Koneksi"}
                </>
              )}
            </Button>
          </>
        )}

        {connectionStep === 0 && (
          <Button onClick={generateConnectionCode} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {locale === "en" ? "Creating Code..." : "Membuat Kode..."}
              </>
            ) : (
              <>
                <Link className="mr-2 h-4 w-4" />
                {locale === "en" ? "Connect Telegram" : "Hubungkan Telegram"}
              </>
            )}
          </Button>
        )}

        {connectionStep === 1 && (
          <Button onClick={verifyConnection} disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {locale === "en" ? "Verifying..." : "Memverifikasi..."}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {locale === "en" ? "Verify Connection" : "Verifikasi Koneksi"}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
