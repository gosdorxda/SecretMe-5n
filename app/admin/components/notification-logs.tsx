"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { RefreshCw, Bell, AlertCircle, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface NotificationLog {
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

export default function NotificationLogs() {
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [channelFilter, setChannelFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchNotificationLogs()
  }, [typeFilter, channelFilter, statusFilter])

  const fetchNotificationLogs = async () => {
    setLoadingLogs(true)
    try {
      let query = supabase.from("notification_logs").select("*").order("created_at", { ascending: false }).limit(100)

      if (typeFilter !== "all") {
        query = query.eq("notification_type", typeFilter)
      }

      if (channelFilter !== "all") {
        query = query.eq("channel", channelFilter)
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) {
        if (error.message?.includes("does not exist")) {
          console.log("Tabel notification_logs tidak ada")
          setNotificationLogs([])
        } else {
          console.error("Error mengambil log notifikasi:", error)
          toast({
            title: "Error",
            description: "Gagal mengambil log notifikasi",
            variant: "destructive",
          })
        }
      } else {
        setNotificationLogs(data || [])
      }
    } catch (error) {
      console.error("Error mengambil log notifikasi:", error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "new_message":
        return "Pesan Baru"
      case "message_reply":
        return "Balasan"
      case "system_update":
        return "Update Sistem"
      case "premium_notification":
        return "Premium"
      default:
        return type || "Tidak diketahui"
    }
  }

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case "email":
        return "Email"
      case "whatsapp":
        return "WhatsApp"
      case "telegram":
        return "Telegram"
      case "in_app":
        return "In-App"
      default:
        return channel || "Tidak diketahui"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Terkirim"
      case "failed":
        return "Gagal"
      case "pending":
        return "Pending"
      default:
        return status || "Tidak diketahui"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Log Notifikasi
        </CardTitle>
        <CardDescription>Pantau riwayat notifikasi yang dikirim ke pengguna melalui berbagai channel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="type-filter" className="text-xs whitespace-nowrap">
                  Tipe:
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter" className="w-[140px]">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="new_message">Pesan Baru</SelectItem>
                    <SelectItem value="message_reply">Balasan</SelectItem>
                    <SelectItem value="system_update">Update Sistem</SelectItem>
                    <SelectItem value="premium_notification">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="channel-filter" className="text-xs whitespace-nowrap">
                  Channel:
                </Label>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger id="channel-filter" className="w-[140px]">
                    <SelectValue placeholder="Semua Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Channel</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="in_app">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="text-xs whitespace-nowrap">
                  Status:
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-[140px]">
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="sent">Terkirim</SelectItem>
                    <SelectItem value="failed">Gagal</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotificationLogs}
              disabled={loadingLogs}
              className="flex items-center gap-2"
            >
              {loadingLogs ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          {loadingLogs ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Memuat log notifikasi...</p>
            </div>
          ) : notificationLogs.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-gray-50">
              <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">Belum ada log notifikasi</p>
              <p className="text-xs text-gray-400">
                {typeFilter !== "all" || channelFilter !== "all" || statusFilter !== "all"
                  ? "Coba ubah filter untuk melihat hasil lain"
                  : "Log akan muncul setelah notifikasi dikirim ke pengguna"}
              </p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waktu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Channel
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(log.created_at), "dd MMM yyyy", { locale: id })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(log.created_at), "HH:mm:ss", { locale: id })}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              log.notification_type === "new_message"
                                ? "bg-blue-100 text-blue-800"
                                : log.notification_type === "message_reply"
                                  ? "bg-purple-100 text-purple-800"
                                  : log.notification_type === "system_update"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : log.notification_type === "premium_notification"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getNotificationTypeLabel(log.notification_type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              log.channel === "email"
                                ? "bg-purple-100 text-purple-800"
                                : log.channel === "whatsapp"
                                  ? "bg-green-100 text-green-800"
                                  : log.channel === "telegram"
                                    ? "bg-blue-100 text-blue-800"
                                    : log.channel === "in_app"
                                      ? "bg-indigo-100 text-indigo-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getChannelLabel(log.channel)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              log.status === "sent"
                                ? "bg-green-100 text-green-800"
                                : log.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : log.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getStatusLabel(log.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{log.user_id}</div>
                          {log.error_message && <div className="text-xs text-red-600 mt-1">{log.error_message}</div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="text-xs">Detail</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Detail Notifikasi</DialogTitle>
                                <DialogDescription>Informasi lengkap tentang notifikasi yang dikirim</DialogDescription>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="space-y-4 mt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">ID Notifikasi</Label>
                                      <p className="text-sm font-mono">{selectedLog.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Waktu</Label>
                                      <p className="text-sm">
                                        {format(new Date(selectedLog.created_at), "dd MMM yyyy HH:mm:ss", {
                                          locale: id,
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">User ID</Label>
                                      <p className="text-sm font-mono">{selectedLog.user_id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Message ID</Label>
                                      <p className="text-sm font-mono">
                                        {selectedLog.message_id || <span className="text-gray-400">-</span>}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Tipe</Label>
                                      <p className="text-sm">
                                        {getNotificationTypeLabel(selectedLog.notification_type)}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Channel</Label>
                                      <p className="text-sm">{getChannelLabel(selectedLog.channel)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Status</Label>
                                      <p className="text-sm">{getStatusLabel(selectedLog.status)}</p>
                                    </div>
                                  </div>

                                  {selectedLog.error_message && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
                                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                      <div>
                                        <Label className="text-xs text-red-800">Error Message</Label>
                                        <p className="text-sm text-red-700">{selectedLog.error_message}</p>
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <Label className="text-xs text-muted-foreground">Data</Label>
                                    <pre className="mt-1 p-3 bg-gray-50 rounded-md text-xs font-mono overflow-x-auto">
                                      {JSON.stringify(selectedLog.data, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h3 className="text-sm font-medium text-blue-800 flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Tentang Log Notifikasi
            </h3>
            <p className="mt-2 text-xs text-blue-700">
              Log notifikasi mencatat semua notifikasi yang dikirim ke pengguna melalui berbagai channel seperti email,
              WhatsApp, dan Telegram. Log ini berguna untuk memantau status pengiriman notifikasi dan mendiagnosis
              masalah jika ada.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
