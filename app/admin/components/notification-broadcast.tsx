"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Bell, Send } from "lucide-react"

export function NotificationBroadcast() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Judul dan pesan tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Ambil semua user yang mengaktifkan notifikasi system_updates
      const { data: users, error: usersError } = await supabase
        .from("notification_preferences")
        .select("user_id")
        .eq("system_updates", true)

      if (usersError) {
        throw new Error(usersError.message)
      }

      if (!users || users.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada pengguna yang mengaktifkan notifikasi sistem",
        })
        return
      }

      // Buat notifikasi untuk setiap user
      const notificationData = users.map((user) => ({
        user_id: user.user_id,
        notification_type: "system_update",
        channel: "email", // Default ke email untuk notifikasi sistem
        status: "pending",
        data: { title, message },
        created_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase.from("notification_logs").insert(notificationData)

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Trigger notifikasi (implementasi sebenarnya akan mengirim email/notifikasi)
      // Untuk demo, kita hanya update status menjadi sent
      const { error: updateError } = await supabase
        .from("notification_logs")
        .update({ status: "sent" })
        .eq("notification_type", "system_update")
        .eq("status", "pending")

      if (updateError) {
        throw new Error(updateError.message)
      }

      toast({
        title: "Berhasil",
        description: `Notifikasi berhasil dikirim ke ${users.length} pengguna`,
      })

      // Reset form
      setTitle("")
      setMessage("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim notifikasi",
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
          Kirim Notifikasi Sistem
        </CardTitle>
        <CardDescription>Kirim notifikasi ke semua pengguna yang mengaktifkan notifikasi sistem</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Judul Notifikasi
            </label>
            <Input
              id="title"
              placeholder="Masukkan judul notifikasi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Pesan Notifikasi
            </label>
            <Textarea
              id="message"
              placeholder="Masukkan pesan notifikasi"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={handleBroadcast}
            disabled={isSubmitting || !title.trim() || !message.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Kirim Notifikasi
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
