"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { StickyNotification } from "@/components/sticky-notification"
// Tambahkan import untuk NotificationBroadcast
import { NotificationBroadcast } from "./notification-broadcast"

type Notification = {
  id: number
  notification_id: string
  message: string
  type: "info" | "success" | "warning" | "error"
  show_icon: boolean
  duration: number | null
  is_active: boolean
  action_text: string | null
  action_url: string | null
  created_at: string
  updated_at: string
}

export default function NotificationSettings() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null)

  const supabase = createClient()

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data notifikasi",
        variant: "destructive",
      })
      console.error(error)
    } else {
      setNotifications(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Toggle notification active status
  const toggleNotificationStatus = async (notification: Notification) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_active: !notification.is_active })
      .eq("id", notification.id)

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status notifikasi",
        variant: "destructive",
      })
      console.error(error)
    } else {
      toast({
        title: "Berhasil",
        description: `Notifikasi ${notification.is_active ? "dinonaktifkan" : "diaktifkan"}`,
      })
      fetchNotifications()
    }
  }

  // Delete notification
  const deleteNotification = async (id: number) => {
    if (!confirm("Yakin ingin menghapus notifikasi ini?")) return

    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus notifikasi",
        variant: "destructive",
      })
      console.error(error)
    } else {
      toast({
        title: "Berhasil",
        description: "Notifikasi berhasil dihapus",
      })
      fetchNotifications()
    }
  }

  // Save notification
  const saveNotification = async () => {
    if (!editingNotification) return

    const { error } = await supabase.from("notifications").upsert({
      id: editingNotification.id,
      notification_id: editingNotification.notification_id,
      message: editingNotification.message,
      type: editingNotification.type,
      show_icon: editingNotification.show_icon,
      duration: editingNotification.duration,
      is_active: editingNotification.is_active,
      action_text: editingNotification.action_text,
      action_url: editingNotification.action_url,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan notifikasi",
        variant: "destructive",
      })
      console.error(error)
    } else {
      toast({
        title: "Berhasil",
        description: "Notifikasi berhasil disimpan",
      })
      setEditingNotification(null)
      fetchNotifications()
    }
  }

  // Create new notification
  const createNewNotification = () => {
    setEditingNotification({
      id: 0,
      notification_id: `notification-${Date.now()}`,
      message: "",
      type: "info",
      show_icon: true,
      duration: 5000,
      is_active: false,
      action_text: null,
      action_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  // Preview notification
  const showPreview = () => {
    if (!editingNotification) return
    setPreviewNotification({ ...editingNotification })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pengaturan Notifikasi</h2>
        <Button onClick={createNewNotification}>Tambah Notifikasi Baru</Button>
      </div>

      {/* Preview notification */}
      {previewNotification && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Preview:</h3>
          <StickyNotification
            id={previewNotification.notification_id}
            message={previewNotification.message}
            type={previewNotification.type}
            showIcon={previewNotification.show_icon}
            duration={null} // Tidak otomatis hilang saat preview
            action={
              previewNotification.action_text ? (
                <a href={previewNotification.action_url || "#"} className="underline">
                  {previewNotification.action_text}
                </a>
              ) : undefined
            }
            onClose={() => setPreviewNotification(null)}
          />
        </div>
      )}

      {/* Edit notification form */}
      {editingNotification && (
        <Card className="border-2 border-black">
          <CardHeader>
            <CardTitle>{editingNotification.id === 0 ? "Tambah Notifikasi Baru" : "Edit Notifikasi"}</CardTitle>
            <CardDescription>Atur pesan dan tampilan notifikasi yang akan ditampilkan di situs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notification_id">ID Notifikasi</Label>
                <Input
                  id="notification_id"
                  value={editingNotification.notification_id}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      notification_id: e.target.value,
                    })
                  }
                  placeholder="welcome-message"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Notifikasi</Label>
                <Select
                  value={editingNotification.type}
                  onValueChange={(value) =>
                    setEditingNotification({
                      ...editingNotification,
                      type: value as any,
                    })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Pesan Notifikasi</Label>
              <Textarea
                id="message"
                value={editingNotification.message}
                onChange={(e) =>
                  setEditingNotification({
                    ...editingNotification,
                    message: e.target.value,
                  })
                }
                placeholder="Masukkan pesan notifikasi di sini"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="action_text">Teks Tombol (Opsional)</Label>
                <Input
                  id="action_text"
                  value={editingNotification.action_text || ""}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      action_text: e.target.value || null,
                    })
                  }
                  placeholder="Lihat Selengkapnya"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action_url">URL Tombol (Opsional)</Label>
                <Input
                  id="action_url"
                  value={editingNotification.action_url || ""}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      action_url: e.target.value || null,
                    })
                  }
                  placeholder="/premium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Durasi (ms, 0 untuk permanen)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={editingNotification.duration || 0}
                  onChange={(e) =>
                    setEditingNotification({
                      ...editingNotification,
                      duration: Number.parseInt(e.target.value) || null,
                    })
                  }
                  placeholder="5000"
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="show_icon"
                  checked={editingNotification.show_icon}
                  onCheckedChange={(checked) =>
                    setEditingNotification({
                      ...editingNotification,
                      show_icon: checked,
                    })
                  }
                />
                <Label htmlFor="show_icon">Tampilkan Ikon</Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={editingNotification.is_active}
                onCheckedChange={(checked) =>
                  setEditingNotification({
                    ...editingNotification,
                    is_active: checked,
                  })
                }
              />
              <Label htmlFor="is_active">Aktifkan Notifikasi</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setEditingNotification(null)}>
                Batal
              </Button>
              <Button variant="outline" onClick={showPreview}>
                Preview
              </Button>
            </div>
            <Button onClick={saveNotification}>Simpan</Button>
          </CardFooter>
        </Card>
      )}

      {/* Notifications list */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle>Daftar Notifikasi</CardTitle>
          <CardDescription>Kelola notifikasi yang ditampilkan di situs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4">Belum ada notifikasi</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pesan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.notification_id}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{notification.message}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          notification.type === "info"
                            ? "bg-blue-100 text-blue-800"
                            : notification.type === "success"
                              ? "bg-green-100 text-green-800"
                              : notification.type === "warning"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {notification.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={notification.is_active}
                        onCheckedChange={() => toggleNotificationStatus(notification)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingNotification(notification)}>
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPreviewNotification(notification)}>
                          Preview
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteNotification(notification.id)}>
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Pastikan komponen NotificationBroadcast ditampilkan di dalam komponen NotificationSettings */}
      {/* Tambahkan kode berikut di akhir div dengan className="space-y-6" (sebelum tag penutup terakhir) */}
      <div className="mt-6">
        <NotificationBroadcast />
      </div>
    </div>
  )
}
