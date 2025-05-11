"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Bell, BellOff, Loader2 } from "lucide-react"

interface NotificationSettingsFormProps {
  userId: string
  telegramConnected: boolean
  telegramId: string | null
}

export function NotificationSettingsForm({ userId, telegramConnected, telegramId }: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState({
    enabled: false,
    channel_type: "none",
    notify_new_messages: true,
    notify_replies: true,
    notify_system_updates: false,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Ambil pengaturan notifikasi saat komponen dimuat
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/notifications/settings")
        const data = await response.json()

        if (data.success && data.data) {
          setSettings({
            enabled: data.data.enabled,
            channel_type: data.data.channel_type || "none",
            notify_new_messages: data.data.notify_new_messages !== undefined ? data.data.notify_new_messages : true,
            notify_replies: data.data.notify_replies !== undefined ? data.data.notify_replies : true,
            notify_system_updates:
              data.data.notify_system_updates !== undefined ? data.data.notify_system_updates : false,
          })
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error)
        toast({
          title: "Error",
          description: "Gagal memuat pengaturan notifikasi",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Handler untuk mengubah pengaturan
  const handleToggleEnabled = (checked: boolean) => {
    setSettings({ ...settings, enabled: checked })
  }

  const handleChannelChange = (value: string) => {
    setSettings({
      ...settings,
      channel_type: value,
    })
  }

  const handleNotificationTypeChange = (type: string, checked: boolean) => {
    setSettings({ ...settings, [type]: checked })
  }

  // Handler untuk menyimpan pengaturan
  const handleSaveSettings = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data?.error || `Error ${response.status}`)
      }

      toast({
        title: "Berhasil",
        description: "Pengaturan notifikasi berhasil disimpan",
      })
    } catch (error: any) {
      console.error("Error saving notification settings:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pengaturan notifikasi",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengaturan Notifikasi</CardTitle>
          <CardDescription>Memuat pengaturan...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {settings.enabled ? (
            <Bell className="h-5 w-5 text-blue-500" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-500" />
          )}
          Pengaturan Notifikasi
        </CardTitle>
        <CardDescription>Atur preferensi notifikasi untuk akun Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Toggle untuk mengaktifkan/menonaktifkan notifikasi */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled" className="text-base">
                Aktifkan Notifikasi
              </Label>
              <p className="text-sm text-muted-foreground">Terima notifikasi tentang aktivitas di akun Anda</p>
            </div>
            <Switch id="notifications-enabled" checked={settings.enabled} onCheckedChange={handleToggleEnabled} />
          </div>

          {settings.enabled && (
            <>
              {/* Pilihan channel notifikasi */}
              <div className="space-y-3 border-t pt-3">
                <Label className="text-base">Metode Notifikasi</Label>
                <RadioGroup value={settings.channel_type} onValueChange={handleChannelChange}>
                  {telegramConnected && (
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="telegram" id="telegram" />
                      <Label htmlFor="telegram">Telegram</Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">Tidak Ada (Matikan Notifikasi)</Label>
                  </div>
                </RadioGroup>

                {!telegramConnected && settings.channel_type === "telegram" && (
                  <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                    Anda perlu menghubungkan akun Telegram terlebih dahulu untuk menggunakan notifikasi Telegram.
                  </div>
                )}
              </div>

              {/* Jenis notifikasi */}
              <div className="space-y-3 border-t pt-3">
                <Label className="text-base">Jenis Notifikasi</Label>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-messages" className="text-sm">
                      Pesan Baru
                    </Label>
                    <p className="text-xs text-muted-foreground">Dapatkan notifikasi saat ada pesan baru masuk</p>
                  </div>
                  <Switch
                    id="notify-messages"
                    checked={settings.notify_new_messages}
                    onCheckedChange={(checked) => handleNotificationTypeChange("notify_new_messages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-replies" className="text-sm">
                      Balasan
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Dapatkan notifikasi saat ada balasan pada pesan Anda
                    </p>
                  </div>
                  <Switch
                    id="notify-replies"
                    checked={settings.notify_replies}
                    onCheckedChange={(checked) => handleNotificationTypeChange("notify_replies", checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-system" className="text-sm">
                      Pembaruan Sistem
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Dapatkan notifikasi tentang pembaruan dan pengumuman sistem
                    </p>
                  </div>
                  <Switch
                    id="notify-system"
                    checked={settings.notify_system_updates}
                    onCheckedChange={(checked) => handleNotificationTypeChange("notify_system_updates", checked)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Tombol simpan */}
          <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full sm:w-auto mt-4">
            {isSaving ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Menyimpan...
              </>
            ) : (
              "Simpan Pengaturan"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
