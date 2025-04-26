"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Bell } from "lucide-react"

interface NotificationPreferencesProps {
  userId: string
  initialPreferences: {
    newMessages: boolean
    messageReplies: boolean
    systemUpdates: boolean
  }
}

export function NotificationPreferences({ userId, initialPreferences }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState({
    newMessages: initialPreferences.newMessages,
    messageReplies: initialPreferences.messageReplies,
    systemUpdates: initialPreferences.systemUpdates,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSavePreferences = async () => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: userId,
          new_messages: preferences.newMessages,
          message_replies: preferences.messageReplies,
          system_updates: preferences.systemUpdates,
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
          <Bell className="h-5 w-5 text-purple-500" />
          Preferensi Notifikasi
        </CardTitle>
        <CardDescription>Pilih jenis notifikasi yang ingin Anda terima</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 space-y-0">
            <Checkbox
              id="new-messages"
              checked={preferences.newMessages}
              onCheckedChange={(checked) => setPreferences({ ...preferences, newMessages: checked === true })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="new-messages"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pesan Baru
              </Label>
              <p className="text-sm text-muted-foreground">Dapatkan notifikasi saat ada pesan baru masuk</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <Checkbox
              id="message-replies"
              checked={preferences.messageReplies}
              onCheckedChange={(checked) => setPreferences({ ...preferences, messageReplies: checked === true })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="message-replies"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Balasan Pesan
              </Label>
              <p className="text-sm text-muted-foreground">Dapatkan notifikasi saat ada balasan baru pada pesan Anda</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 space-y-0">
            <Checkbox
              id="system-updates"
              checked={preferences.systemUpdates}
              onCheckedChange={(checked) => setPreferences({ ...preferences, systemUpdates: checked === true })}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="system-updates"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Update Sistem
              </Label>
              <p className="text-sm text-muted-foreground">
                Dapatkan notifikasi tentang fitur baru dan pembaruan sistem
              </p>
            </div>
          </div>

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
