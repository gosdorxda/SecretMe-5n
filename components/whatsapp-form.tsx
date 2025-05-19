"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, MessageSquare, Send, X } from "lucide-react"

interface WhatsAppFormProps {
  userId: string
  locale?: "id" | "en"
}

export function WhatsAppForm({ userId, locale = "id" }: WhatsAppFormProps) {
  const [isComingSoon] = useState(true)

  return (
    <Card className="mt-4 relative overflow-hidden border border-gray-200 shadow-sm">
      {isComingSoon && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl border shadow-sm text-center max-w-xs">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-xl mb-2">{locale === "en" ? "Coming Soon" : "Segera Hadir"}</h3>
            <p className="text-gray-600">
              {locale === "en"
                ? "WhatsApp notifications are under development and will be available soon."
                : "Notifikasi WhatsApp sedang dalam pengembangan dan akan segera tersedia untuk Anda."}
            </p>
          </div>
        </div>
      )}

      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50">
            <MessageSquare className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">
              {locale === "en" ? "WhatsApp Notifications" : "Notifikasi WhatsApp"}
            </CardTitle>
            <CardDescription>
              {locale === "en"
                ? "Receive new message notifications directly to your WhatsApp"
                : "Terima notifikasi pesan baru langsung ke WhatsApp Anda"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2 space-y-4">
        <div className="rounded-lg border p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-notifications" className="text-base font-medium">
                {locale === "en" ? "Enable Notifications" : "Aktifkan Notifikasi"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {locale === "en"
                  ? "Get notified when you receive new messages"
                  : "Dapatkan pemberitahuan saat ada pesan baru"}
              </p>
            </div>
            <Switch id="whatsapp-notifications" disabled />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="whatsapp-number" className="font-medium">
              {locale === "en" ? "WhatsApp Number" : "Nomor WhatsApp"}
            </Label>
            <div className="flex gap-2">
              <Input id="whatsapp-number" placeholder="+628xxxxxxxxxx" disabled={isComingSoon} className="font-mono" />
              <Button
                variant="outline"
                disabled={isComingSoon}
                className="shrink-0 border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
              >
                {locale === "en" ? "Verify" : "Verifikasi"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === "en" ? "International format: +628xxxxxxxxxx" : "Format internasional: +628xxxxxxxxxx"}
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-white">
            <h4 className="font-medium text-sm mb-2">{locale === "en" ? "Connection Steps:" : "Langkah Koneksi:"}</h4>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                  1
                </span>
                <span>
                  {locale === "en"
                    ? "Enter your WhatsApp number in international format"
                    : "Masukkan nomor WhatsApp Anda dengan format internasional"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                  2
                </span>
                <span>
                  {locale === "en"
                    ? "Click the Verify button to get an OTP code"
                    : "Klik tombol Verifikasi untuk mendapatkan kode OTP"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                  3
                </span>
                <span>
                  {locale === "en"
                    ? "Enter the OTP code to complete the connection"
                    : "Masukkan kode OTP untuk menyelesaikan koneksi"}
                </span>
              </li>
            </ol>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-4 border-t mt-2">
        <Button variant="outline" size="sm" disabled={isComingSoon} className="text-green-600">
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {locale === "en" ? "Send Test Message" : "Kirim Pesan Uji"}
        </Button>
        <Button variant="outline" size="sm" disabled={isComingSoon} className="text-red-500">
          <X className="h-3.5 w-3.5 mr-1.5" />
          {locale === "en" ? "Disconnect" : "Putuskan Koneksi"}
        </Button>
      </CardFooter>
    </Card>
  )
}
