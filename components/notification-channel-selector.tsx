"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Bell, MessageSquare, Mail, AlertCircle } from "lucide-react"

interface NotificationChannelSelectorProps {
  userId: string
  initialChannel?: string | null
  hasTelegram?: boolean
  hasWhatsApp?: boolean
}

export function NotificationChannelSelector({
  userId,
  initialChannel,
  hasTelegram,
  hasWhatsApp,
}: NotificationChannelSelectorProps) {
  const [channel, setChannel] = useState<string>(initialChannel || "email")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleChannelChange = async (value: string) => {
    setIsLoading(true)
    try {
      // Validasi channel
      if (value === "telegram" && !hasTelegram) {
        toast({
          title: "Telegram Belum Terhubung",
          description: "Hubungkan Telegram terlebih dahulu sebelum mengaktifkan notifikasi",
          variant: "destructive",
        })
        return
      }

      if (value === "whatsapp" && !hasWhatsApp) {
        toast({
          title: "WhatsApp Belum Terhubung",
          description: "Hubungkan WhatsApp terlebih dahulu sebelum mengaktifkan notifikasi",
          variant: "destructive",
        })
        return
      }

      // Update channel
      const { error } = await supabase.from("users").update({ notification_channel: value }).eq("id", userId)

      if (error) throw error

      setChannel(value)
      toast({
        title: "Pengaturan Notifikasi Diperbarui",
        description: `Notifikasi akan dikirim melalui ${getChannelName(value)}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah pengaturan notifikasi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getChannelName = (channelValue: string) => {
    switch (channelValue) {
      case "email":
        return "Email"
      case "telegram":
        return "Telegram"
      case "whatsapp":
        return "WhatsApp"
      default:
        return channelValue
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Channel Notifikasi</h3>
          </div>
          <p className="text-sm text-muted-foreground">Pilih channel untuk menerima notifikasi pesan baru</p>

          <RadioGroup value={channel} onValueChange={handleChannelChange} className="mt-3 space-y-3">
            <div className="flex items-start space-x-2 rounded-md border p-3 shadow-sm">
              <RadioGroupItem value="email" id="email" disabled={isLoading} />
              <Label
                htmlFor="email"
                className="flex flex-col space-y-1 cursor-pointer"
                onClick={() => handleChannelChange("email")}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Email</span>
                </div>
                <span className="text-xs text-muted-foreground">Notifikasi akan dikirim ke alamat email Anda</span>
              </Label>
            </div>

            <div
              className={`flex items-start space-x-2 rounded-md border p-3 shadow-sm ${
                !hasTelegram ? "opacity-60" : ""
              }`}
            >
              <RadioGroupItem value="telegram" id="telegram" disabled={isLoading || !hasTelegram} />
              <Label
                htmlFor="telegram"
                className="flex flex-col space-y-1 cursor-pointer"
                onClick={() => hasTelegram && handleChannelChange("telegram")}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Telegram</span>
                  {!hasTelegram && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Belum Terhubung</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {hasTelegram
                    ? "Notifikasi akan dikirim ke akun Telegram Anda"
                    : "Hubungkan Telegram terlebih dahulu di pengaturan Telegram"}
                </span>
              </Label>
            </div>

            <div
              className={`flex items-start space-x-2 rounded-md border p-3 shadow-sm ${
                !hasWhatsApp ? "opacity-60" : ""
              }`}
            >
              <RadioGroupItem value="whatsapp" id="whatsapp" disabled={isLoading || !hasWhatsApp} />
              <Label
                htmlFor="whatsapp"
                className="flex flex-col space-y-1 cursor-pointer"
                onClick={() => hasWhatsApp && handleChannelChange("whatsapp")}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="font-medium">WhatsApp</span>
                  {!hasWhatsApp && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Belum Terhubung</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {hasWhatsApp
                    ? "Notifikasi akan dikirim ke WhatsApp Anda"
                    : "Hubungkan WhatsApp terlebih dahulu di pengaturan WhatsApp"}
                </span>
              </Label>
            </div>
          </RadioGroup>

          {/* Informasi tambahan */}
          <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-700">
                Pastikan Anda telah menghubungkan channel yang dipilih untuk menerima notifikasi.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Jika Anda tidak menerima notifikasi, periksa pengaturan notifikasi di channel yang dipilih.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
