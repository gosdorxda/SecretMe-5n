"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface NotificationToggleProps {
  userId: string
  initialEnabled: boolean
  hasTelegramId: boolean
  telegramNotificationsEnabled: boolean
}

export function NotificationToggle({
  userId,
  initialEnabled,
  hasTelegramId,
  telegramNotificationsEnabled,
}: NotificationToggleProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialEnabled)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  async function handleToggleNotifications(enabled: boolean) {
    setIsSubmitting(true)

    try {
      // Jika mengaktifkan notifikasi tapi tidak ada Telegram ID atau notifikasi Telegram dinonaktifkan
      if (enabled && (!hasTelegramId || !telegramNotificationsEnabled)) {
        toast({
          title: "Perhatian",
          description: "Anda perlu menghubungkan dan mengaktifkan Telegram untuk menerima notifikasi",
          variant: "destructive",
        })
        return
      }

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
    <div className="space-y-4">
      {!hasTelegramId && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Anda perlu menghubungkan akun Telegram terlebih dahulu untuk mengaktifkan notifikasi.
          </AlertDescription>
        </Alert>
      )}

      {hasTelegramId && !telegramNotificationsEnabled && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Anda perlu mengaktifkan notifikasi Telegram terlebih dahulu.
          </AlertDescription>
        </Alert>
      )}

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
          disabled={isSubmitting || !hasTelegramId || !telegramNotificationsEnabled}
        />
      </div>
    </div>
  )
}
