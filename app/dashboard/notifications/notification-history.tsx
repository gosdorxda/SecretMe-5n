"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, MessageSquare, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { NotificationPreferences } from "@/components/notification-preferences"

interface Notification {
  id: string
  user_id: string
  message_id: string | null
  notification_type: string
  channel: string
  status: string
  created_at: string
  data: any
  error_message: string | null
}

interface NotificationHistoryProps {
  notifications: Notification[]
  userId: string
  userPreferences: {
    newMessages: boolean
    messageReplies: boolean
    systemUpdates: boolean
  }
}

export function NotificationHistory({ notifications, userId, userPreferences }: NotificationHistoryProps) {
  const [activeTab, setActiveTab] = useState("history")

  // Fungsi untuk mendapatkan ikon berdasarkan tipe notifikasi
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "message_reply":
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case "system_update":
        return <Bell className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Fungsi untuk mendapatkan judul berdasarkan tipe notifikasi
  const getNotificationTitle = (type: string) => {
    switch (type) {
      case "new_message":
        return "Pesan Baru"
      case "message_reply":
        return "Balasan Pesan"
      case "system_update":
        return "Update Sistem"
      default:
        return "Notifikasi"
    }
  }

  // Fungsi untuk mendapatkan badge status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terkirim
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Gagal
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        )
    }
  }

  // Fungsi untuk mendapatkan badge channel
  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "email":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Email
          </Badge>
        )
      case "whatsapp":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            WhatsApp
          </Badge>
        )
      case "telegram":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Telegram
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {channel}
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Notifikasi</CardTitle>
        <CardDescription>Kelola dan lihat riwayat notifikasi Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Belum ada notifikasi</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Notifikasi akan muncul di sini saat Anda menerima pesan baru atau ada pembaruan sistem.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h4 className="text-sm font-medium">{getNotificationTitle(notification.notification_type)}</h4>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(notification.status)}
                          {getChannelBadge(notification.channel)}
                        </div>
                      </div>
                      {notification.error_message && (
                        <p className="text-xs text-red-600 mt-1">{notification.error_message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <NotificationPreferences userId={userId} initialPreferences={userPreferences} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
