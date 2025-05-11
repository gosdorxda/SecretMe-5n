"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Bell } from "lucide-react"

interface NotificationPreferencesProps {
  userId: string
  initialChannel: string
  initialWhatsappEnabled: boolean
  initialTelegramEnabled: boolean
}

export function NotificationPreferences({
  userId,
  initialChannel,
  initialWhatsappEnabled,
  initialTelegramEnabled,
}: NotificationPreferencesProps) {
  const [channel, setChannel] = useState(initialChannel || "email")
  const [whatsappEnabled, setWhatsappEnabled] = useState(initialWhatsappEnabled)
  const [telegramEnabled, setTelegramEnabled] = useState(initialTelegramEnabled)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSavePreferences = async () => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          notification_channel: channel,
          whatsapp_notifications: whatsappEnabled,
          telegram_notifications: telegramEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Berhasil",
        description: "Preferensi notifikasi berhasil disimpan",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan preferensi notifikasi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-500" />
          Preferensi Notifikasi
        </CardTitle>
        <CardDescription>Pilih saluran notifikasi yang Anda inginkan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <RadioGroup value={channel} onValueChange={setChannel}>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="email" id="email" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="email">Email</Label>
                <p className="text-sm text-muted-foreground">Terima notifikasi melalui email yang terdaftar</p>
              </div>
            </div>

            <div className="flex items-start space-x-2 mt-3">
              <RadioGroupItem value="telegram" id="telegram" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="telegram">Telegram</Label>
                <p className="text-sm text-muted-foreground">
                  Terima notifikasi melalui Telegram (perlu mengatur Telegram ID)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 mt-3">
              <RadioGroupItem value="whatsapp" id="whatsapp" />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Terima notifikasi melalui WhatsApp (perlu mengatur nomor WhatsApp)
                </p>
              </div>
            </div>
          </RadioGroup>

          <Button onClick={handleSavePreferences} disabled={isSubmitting} className="mt-4 w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Menyimpan...
              </>
            ) : (
              "Simpan Preferensi"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
