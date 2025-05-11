"use client"

import { NotificationSettings } from "@/components/notification-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface NotificationTabProps {
  user: UserType
}

export function NotificationTab({ user }: NotificationTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Pengaturan Notifikasi</h2>
      </div>

      <p className="text-muted-foreground">
        Kelola preferensi notifikasi Anda untuk tetap mendapatkan informasi tentang pesan baru.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Preferensi Notifikasi</CardTitle>
          <CardDescription>Pilih bagaimana Anda ingin menerima notifikasi saat ada pesan baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationSettings userId={user.id} />
        </CardContent>
      </Card>

      {!user.is_premium && (
        <Card className="bg-muted/50 border-dashed">
          <CardHeader>
            <CardTitle>Fitur Premium</CardTitle>
            <CardDescription>
              Tingkatkan ke akun premium untuk mendapatkan notifikasi real-time melalui Telegram dan WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dengan akun premium, Anda akan mendapatkan notifikasi instan saat ada pesan baru, sehingga Anda tidak akan
              melewatkan pesan penting.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
