"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Bell, MessageSquare, Mail } from "lucide-react"

interface NotificationSettingsProps {
  userId: string
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [channel, setChannel] = useState<"email" | "telegram" | "whatsapp">("email")
  const [telegramId, setTelegramId] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Ambil data notifikasi pengguna
  useEffect(() => {
    async function fetchNotificationSettings() {
      try {
        setIsLoading(true)

        // Ambil data user untuk cek status premium
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("is_premium")
          .eq("id", userId)
          .single()

        if (userError) throw userError
        setIsPremium(userData.is_premium || false)

        // Ambil pengaturan notifikasi
        const { data, error } = await supabase.from("user_notifications").select("*").eq("user_id", userId).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setEnabled(data.enabled || false)
          setChannel(data.channel || "email")
          setTelegramId(data.telegram_id || "")
          setWhatsappNumber(data.whatsapp_number || "")
        }
      } catch (error: any) {
        console.error("Error fetching notification settings:", error)
        toast({
          title: "Gagal memuat pengaturan notifikasi",
          description: error.message || "Terjadi kesalahan saat memuat pengaturan notifikasi",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotificationSettings()
  }, [supabase, userId, toast])

  // Simpan pengaturan notifikasi
  async function saveSettings() {
    try {
      setIsSaving(true)

      const { error } = await supabase.from("user_notifications").upsert({
        user_id: userId,
        enabled,
        channel,
        telegram_id: telegramId,
        whatsapp_number: whatsappNumber,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Pengaturan notifikasi disimpan",
        description: "Preferensi notifikasi Anda telah diperbarui",
      })
    } catch (error: any) {
      console.error("Error saving notification settings:", error)
      toast({
        title: "Gagal menyimpan pengaturan",
        description: error.message || "Terjadi kesalahan saat menyimpan pengaturan notifikasi",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Kirim notifikasi test
  async function sendTestNotification() {
    try {
      setIsTesting(true)

      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          channel,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim notifikasi test")
      }

      toast({
        title: "Notifikasi test terkirim",
        description:
          "Silakan periksa " +
          (channel === "email" ? "email" : channel === "telegram" ? "Telegram" : "WhatsApp") +
          " Anda",
      })
    } catch (error: any) {
      console.error("Error sending test notification:", error)
      toast({
        title: "Gagal mengirim notifikasi test",
        description: error.message || "Terjadi kesalahan saat mengirim notifikasi test",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <Label htmlFor="notifications-enabled" className="font-medium">
            Aktifkan Notifikasi
          </Label>
        </div>
        <Switch id="notifications-enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <>
          <div className="space-y-3">
            <Label className="font-medium">Pilih Saluran Notifikasi</Label>
            <RadioGroup value={channel} onValueChange={(v) => setChannel(v as any)} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="telegram" id="telegram" disabled={!isPremium} />
                <Label
                  htmlFor="telegram"
                  className={`flex items-center gap-2 ${!isPremium ? "text-muted-foreground" : ""}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.2647 2.12818C21.98 1.87711 21.6364 1.70896 21.2704 1.64322C20.9045 1.57748 20.5284 1.61699 20.1847 1.75818C20.1847 1.75818 3.13667 8.30018 2.19467 9.04218C1.85067 9.32118 1.69267 9.56118 1.62067 9.84118C1.28667 10.9062 2.06467 11.4252 2.06467 11.4252L6.47667 12.9252C6.63467 12.9722 6.79867 12.9722 6.95667 12.9252C7.95667 12.3222 16.4547 7.04218 16.9387 6.84118C17.0387 6.80118 17.1237 6.80118 17.1687 6.84118C17.2137 6.88118 17.2137 6.97618 17.1687 7.06218C17.0987 7.34218 9.91267 13.6452 9.76867 13.7812C9.70467 13.8342 9.65667 13.9092 9.63467 13.9932L8.16867 19.1932C8.16867 19.1932 7.88067 20.4582 9.16867 19.1932C10.0987 18.2842 10.9847 17.5132 11.4387 17.1132C12.8307 18.0452 14.3547 19.0612 15.0387 19.5812C15.2307 19.7212 15.4457 19.8192 15.6747 19.8712C15.9037 19.9232 16.1417 19.9282 16.3727 19.8862C16.6037 19.8442 16.8227 19.7562 17.0177 19.6272C17.2127 19.4982 17.3797 19.3312 17.5087 19.1362C17.5087 19.1362 21.8227 7.66218 22.1177 5.30118C22.1457 5.05918 22.1737 4.90118 22.1737 4.71518C22.1737 4.52918 22.1457 4.34318 22.1177 4.18518C22.0677 3.73918 21.9027 3.31218 21.6387 2.95518C21.5354 2.81711 21.4096 2.69541 21.2667 2.59518C21.2667 2.59518 21.4387 2.46518 22.2647 2.12818Z"
                      fill="currentColor"
                    />
                  </svg>
                  Telegram {!isPremium && "(Premium)"}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="whatsapp" id="whatsapp" disabled={!isPremium} />
                <Label
                  htmlFor="whatsapp"
                  className={`flex items-center gap-2 ${!isPremium ? "text-muted-foreground" : ""}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M19.0814 4.91862C16.9744 2.8116 14.1424 1.6046 11.1494 1.6046C5.0144 1.6046 0.0294 6.5896 0.0294 12.7246C0.0294 14.6796 0.5334 16.5846 1.4994 18.2746L0.0294 24.0046L5.8794 22.5646C7.5094 23.4406 9.3144 23.9046 11.1494 23.9046C17.2844 23.9046 22.2694 18.9196 22.2694 12.7846C22.2694 9.7916 21.1884 6.9596 19.0814 4.91862ZM11.1494 21.9996C9.4944 21.9996 7.8694 21.5556 6.4794 20.7396L6.1794 20.5596L2.6994 21.4196L3.5594 18.0296L3.3794 17.7296C2.4734 16.2796 1.9694 14.5346 1.9694 12.7246C1.9694 7.6146 6.0394 3.5446 11.1494 3.5446C13.6194 3.5446 15.9694 4.5446 17.7144 6.2896C19.4594 8.0346 20.3994 10.3846 20.3994 12.8546C20.3294 17.9646 16.2594 21.9996 11.1494 21.9996ZM16.1994 15.2546C15.9294 15.1146 14.5694 14.4446 14.3594 14.3646C14.1494 14.2846 13.9994 14.2446 13.7894 14.5146C13.5794 14.7846 13.0754 15.3746 12.9354 15.5846C12.7954 15.7946 12.6554 15.8146 12.3854 15.6746C12.1154 15.5346 11.2194 15.2346 10.1694 14.3046C9.3534 13.5746 8.8094 12.6746 8.6694 12.4046C8.5294 12.1346 8.6694 12.0146 8.7894 11.8746C8.9094 11.7546 9.0294 11.5746 9.1694 11.4346C9.3094 11.2946 9.3494 11.1746 9.4294 10.9646C9.5094 10.7546 9.4694 10.6146 9.4094 10.4746C9.3494 10.3346 8.7894 8.9746 8.5794 8.4346C8.3694 7.8946 8.1594 7.9746 8.0194 7.9746C7.8794 7.9746 7.7294 7.9746 7.5194 7.9746C7.3094 7.9746 6.9794 8.0346 6.7694 8.3046C6.5594 8.5746 5.8494 9.2446 5.8494 10.6046C5.8494 11.9646 6.7994 13.2646 6.9394 13.4746C7.0794 13.6846 8.7894 16.3146 11.3994 17.4946C12.0594 17.7946 12.5794 17.9646 12.9894 18.0846C13.6494 18.2846 14.2494 18.2546 14.7294 18.1946C15.2694 18.1346 16.3894 17.5546 16.5994 16.9146C16.8094 16.2746 16.8094 15.7346 16.7494 15.6146C16.6894 15.4946 16.4794 15.4346 16.1994 15.2546Z"
                      fill="currentColor"
                    />
                  </svg>
                  WhatsApp {!isPremium && "(Premium)"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {channel === "telegram" && isPremium && (
            <div className="space-y-2">
              <Label htmlFor="telegram-id">Telegram ID</Label>
              <Input
                id="telegram-id"
                placeholder="Masukkan Telegram ID Anda"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Untuk mendapatkan Telegram ID, kirim pesan ke @SecretMeBot di Telegram.
              </p>
            </div>
          )}

          {channel === "whatsapp" && isPremium && (
            <div className="space-y-2">
              <Label htmlFor="whatsapp-number">Nomor WhatsApp</Label>
              <Input
                id="whatsapp-number"
                placeholder="Contoh: 628123456789"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Masukkan nomor WhatsApp dengan format internasional tanpa tanda + atau spasi.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
              Simpan Pengaturan
            </Button>

            <Button
              variant="outline"
              onClick={sendTestNotification}
              disabled={
                isTesting ||
                !enabled ||
                (channel === "telegram" && !telegramId) ||
                (channel === "whatsapp" && !whatsappNumber)
              }
            >
              {isTesting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
              Kirim Notifikasi Test
            </Button>
          </div>
        </>
      )}

      {!isPremium && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-medium flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Tingkatkan ke Premium
          </p>
          <p className="mt-1 text-muted-foreground">
            Dapatkan notifikasi real-time melalui Telegram dan WhatsApp dengan mengupgrade ke akun premium.
          </p>
        </div>
      )}
    </div>
  )
}
