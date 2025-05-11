"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface SimpleNotificationPreferencesProps {
  userId: string
  initialEnabled: boolean
  initialChannel: string | null
}

export function SimpleNotificationPreferences({
  userId,
  initialEnabled,
  initialChannel,
}: SimpleNotificationPreferencesProps) {
  const [newMessagesEnabled, setNewMessagesEnabled] = useState(initialEnabled)
  const [notificationChannel, setNotificationChannel] = useState<string | null>(initialChannel)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSavePreferences = async () => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          new_messages: newMessagesEnabled,
          notification_channel: notificationChannel,
          updated_at: new Date().toISOString(),
        })
        .select()

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
          {newMessagesEnabled ? (
            <Bell className="h-5 w-5 text-blue-500" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-500" />
          )}
          Preferensi Notifikasi
        </CardTitle>
        <CardDescription>Atur preferensi notifikasi pesan masuk</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="new-messages" className="text-base">
                Notifikasi Pesan Baru
              </Label>
              <p className="text-sm text-muted-foreground">Dapatkan notifikasi saat ada pesan baru masuk</p>
            </div>
            <Switch id="new-messages" checked={newMessagesEnabled} onCheckedChange={setNewMessagesEnabled} />
          </div>

          {newMessagesEnabled && (
            <div className="space-y-3 border-t pt-3">
              <Label className="text-base">Metode Notifikasi</Label>
              <RadioGroup
                value={notificationChannel || ""}
                onValueChange={(value) => setNotificationChannel(value || null)}
              >
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="telegram" id="telegram" />
                  <Label htmlFor="telegram">Telegram</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="" id="none" />
                  <Label htmlFor="none">Tidak Ada (Matikan Notifikasi)</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <Button onClick={handleSavePreferences} disabled={isSubmitting} className="w-full sm:w-auto mt-4">
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
