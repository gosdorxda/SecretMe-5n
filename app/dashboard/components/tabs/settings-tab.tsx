"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleNotificationPreferences } from "@/components/simple-notification-preferences"
import { TelegramForm } from "@/components/telegram-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SettingsTabProps {
  userId: string
  telegramId: string | null
  telegramNotifications: boolean | null
  notificationChannel: string | null
}

export function SettingsTab({ userId, telegramId, telegramNotifications, notificationChannel }: SettingsTabProps) {
  const [activeTab, setActiveTab] = useState("notifications")

  return (
    <div className="space-y-4 py-4 md:py-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan</h2>
        <p className="text-muted-foreground">Kelola pengaturan akun dan notifikasi Anda.</p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2">
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Notifikasi</CardTitle>
              <CardDescription>Pilih jenis notifikasi yang ingin Anda terima.</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleNotificationPreferences userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="telegram" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi Telegram</CardTitle>
              <CardDescription>Hubungkan akun Telegram Anda untuk menerima notifikasi.</CardDescription>
            </CardHeader>
            <CardContent>
              <TelegramForm
                userId={userId}
                initialTelegramId={telegramId}
                initialTelegramNotifications={telegramNotifications}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
