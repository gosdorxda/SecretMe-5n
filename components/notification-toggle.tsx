"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Bell } from "lucide-react"

interface NotificationToggleProps {
  userId: string
  initialEnabled: boolean
}

export function NotificationToggle({ userId, initialEnabled }: NotificationToggleProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialEnabled)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  async function handleToggleNotifications(enabled: boolean) {
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("users").update({ notifications_enabled: enabled }).eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      setNotificationsEnabled(enabled)
      toast({
        title: "Berhasil",
        description: enabled ? "Notifikasi pesan baru telah diaktifkan" : "Notifikasi pesan baru telah dinonaktifkan",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pengaturan notifikasi",
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
          <Bell className="h-5 w-5 text-blue-500" />
          Pengaturan Notifikasi
        </CardTitle>
        <CardDescription>Aktifkan atau nonaktifkan notifikasi pesan masuk</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-toggle" className="text-base">
              Notifikasi Pesan Baru
            </Label>
            <p className="text-sm text-muted-foreground">Dapatkan notifikasi saat ada pesan baru masuk</p>
          </div>
          <Switch
            id="notifications-toggle"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isSubmitting}
          />
        </div>
      </CardContent>
    </Card>
  )
}
