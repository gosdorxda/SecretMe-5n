"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Bell, Mail, Phone, MessageSquare } from "lucide-react"

interface NotificationChannelSelectorProps {
  userId: string
  initialChannel: string | null
  hasWhatsApp: boolean
  hasTelegram: boolean
}

export function NotificationChannelSelector({
  userId,
  initialChannel,
  hasWhatsApp,
  hasTelegram,
}: NotificationChannelSelectorProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>(initialChannel || "email")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSaveChannel = async () => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          notification_channel: selectedChannel,
        })
        .eq("id", userId)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Berhasil",
        description: "Channel notifikasi berhasil diperbarui",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui channel notifikasi",
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
          Channel Notifikasi
        </CardTitle>
        <CardDescription>Pilih bagaimana Anda ingin menerima notifikasi</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedChannel} onValueChange={setSelectedChannel} className="space-y-4">
          <div
            className={`flex items-center space-x-2 rounded-md border p-4 ${selectedChannel === "email" ? "bg-blue-50 border-blue-200" : ""}`}
          >
            <RadioGroupItem value="email" id="email" />
            <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">Notifikasi dikirim ke alamat email Anda</p>
              </div>
            </Label>
          </div>

          <div
            className={`flex items-center space-x-2 rounded-md border p-4 ${!hasWhatsApp ? "opacity-50" : ""} ${selectedChannel === "whatsapp" ? "bg-green-50 border-green-200" : ""}`}
          >
            <RadioGroupItem value="whatsapp" id="whatsapp" disabled={!hasWhatsApp} />
            <Label htmlFor="whatsapp" className="flex items-center gap-2 cursor-pointer">
              <Phone className="h-5 w-5 text-green-500" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">WhatsApp</p>
                  {!hasWhatsApp && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Perlu Setup</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasWhatsApp
                    ? "Notifikasi dikirim ke WhatsApp Anda"
                    : "Tambahkan nomor WhatsApp Anda terlebih dahulu"}
                </p>
              </div>
            </Label>
          </div>

          <div
            className={`flex items-center space-x-2 rounded-md border p-4 ${!hasTelegram ? "opacity-50" : ""} ${selectedChannel === "telegram" ? "bg-blue-50 border-blue-200" : ""}`}
          >
            <RadioGroupItem value="telegram" id="telegram" disabled={!hasTelegram} />
            <Label htmlFor="telegram" className="flex items-center gap-2 cursor-pointer">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Telegram</p>
                  {!hasTelegram && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Perlu Setup</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasTelegram ? "Notifikasi dikirim ke Telegram Anda" : "Tambahkan Telegram ID Anda terlebih dahulu"}
                </p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <Button onClick={handleSaveChannel} disabled={isSubmitting} className="mt-6 w-full sm:w-auto">
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
              Menyimpan...
            </>
          ) : (
            "Simpan Preferensi"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
