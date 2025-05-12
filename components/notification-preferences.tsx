"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TelegramForm } from "@/components/telegram-form"
import { Bell, MessageCircle } from "lucide-react"
import { WhatsAppForm } from "@/components/whatsapp-form"

interface NotificationPreferencesProps {
  userId: string
  initialTelegramId: string | null
  initialTelegramNotifications: boolean
  initialNotificationChannel: string | null
}

export function NotificationPreferences({
  userId,
  initialTelegramId,
  initialTelegramNotifications,
  initialNotificationChannel,
}: NotificationPreferencesProps) {
  const [notificationChannel, setNotificationChannel] = useState<string>(initialNotificationChannel || "telegram")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSaveChannel = async () => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          notification_channel: notificationChannel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Berhasil",
        description: "Saluran notifikasi berhasil disimpan",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan saluran notifikasi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Saluran Notifikasi
          </CardTitle>
          <CardDescription>Pilih saluran notifikasi yang Anda inginkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <RadioGroup
              value={notificationChannel}
              onValueChange={setNotificationChannel}
              className="flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="telegram" id="telegram" />
                <Label htmlFor="telegram" className="font-normal">
                  Telegram
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="font-normal">
                  Tidak ada notifikasi
                </Label>
              </div>
            </RadioGroup>

            <Button onClick={handleSaveChannel} disabled={isSubmitting} className="w-full sm:w-auto mt-2">
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Menyimpan...
                </>
              ) : (
                "Simpan Saluran"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            Pengaturan Telegram
          </CardTitle>
          <CardDescription>Hubungkan akun Telegram Anda untuk menerima notifikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <TelegramForm
            userId={userId}
            initialTelegramId={initialTelegramId}
            initialTelegramNotifications={initialTelegramNotifications}
          />
        </CardContent>
      </Card>

      {/* WhatsApp Settings */}
      <WhatsAppForm userId={userId} />
    </div>
  )
}
