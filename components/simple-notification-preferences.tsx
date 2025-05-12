"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Bell } from "lucide-react"

interface SimpleNotificationPreferencesProps {
  userId: string
}

export function SimpleNotificationPreferences({ userId }: SimpleNotificationPreferencesProps) {
  const [newMessagesEnabled, setNewMessagesEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("new_messages")
          .eq("user_id", userId)
          .single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setNewMessagesEnabled(data.new_messages)
        } else {
          // Jika tidak ada preferensi, buat default
          await createDefaultPreferences()
        }
      } catch (error: any) {
        console.error("Error loading preferences:", error)
        toast({
          title: "Gagal memuat preferensi",
          description: error.message || "Terjadi kesalahan saat memuat preferensi notifikasi.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [supabase, userId])

  async function createDefaultPreferences() {
    try {
      const { error } = await supabase.from("notification_preferences").insert({
        user_id: userId,
        new_messages: true,
        // Tetap menyimpan nilai default untuk kolom lain
        message_replies: true,
        system_updates: true,
      })

      if (error) throw error
    } catch (error: any) {
      console.error("Error creating default preferences:", error)
    }
  }

  async function updatePreference(value: boolean) {
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("notification_preferences")
        .update({ new_messages: value })
        .eq("user_id", userId)

      if (error) throw error

      setNewMessagesEnabled(value)
      toast({
        title: "Preferensi diperbarui",
        description: "Pengaturan notifikasi Anda telah diperbarui.",
      })
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui preferensi",
        description: error.message || "Terjadi kesalahan saat memperbarui preferensi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="py-2">Memuat preferensi notifikasi...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-500" />
          Preferensi Notifikasi
        </CardTitle>
        <CardDescription>Aktifkan atau nonaktifkan notifikasi pesan masuk</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="new-messages" className="text-base">
              Notifikasi Pesan Baru
            </Label>
            <p className="text-sm text-muted-foreground">Dapatkan notifikasi saat ada pesan baru masuk</p>
          </div>
          <Switch
            id="new-messages"
            checked={newMessagesEnabled}
            onCheckedChange={updatePreference}
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}
