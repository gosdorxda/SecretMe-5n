"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"

interface WhatsAppFormProps {
  userId: string
}

export function WhatsAppForm({ userId }: WhatsAppFormProps) {
  const [isComingSoon] = useState(true)

  return (
    <Card className="mt-4 relative overflow-hidden">
      {isComingSoon && (
        <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg border shadow-sm text-center max-w-xs">
            <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <h3 className="font-bold text-lg mb-1">Segera Hadir</h3>
            <p className="text-sm text-gray-600">
              Notifikasi WhatsApp sedang dalam pengembangan dan akan segera tersedia.
            </p>
          </div>
        </div>
      )}

      <CardHeader className="pb-3 pt-6">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div className="flex items-center justify-center bg-green-50 text-green-500 p-1.5 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
              <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
              <path d="M9 14a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 0-1h-5a.5.5 0 0 0-.5.5Z" />
            </svg>
          </div>
          <span>Notifikasi WhatsApp</span>
        </CardTitle>
        <CardDescription>Terima notifikasi pesan baru langsung ke WhatsApp Anda.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="p-3 bg-gray-50 rounded-lg border mb-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-notifications" className="text-base font-medium">
                Notifikasi WhatsApp
              </Label>
              <p className="text-sm text-muted-foreground">
                Aktifkan untuk menerima notifikasi pesan baru melalui WhatsApp
              </p>
            </div>
            <Switch id="whatsapp-notifications" disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp-number">Nomor WhatsApp</Label>
          <div className="flex gap-2">
            <Input id="whatsapp-number" placeholder="+628xxxxxxxxxx" disabled={isComingSoon} className="font-mono" />
            <Button variant="secondary" disabled={isComingSoon} className="shrink-0">
              Verifikasi
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Masukkan nomor WhatsApp Anda dengan format internasional (contoh: +628xxxxxxxxxx)
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-5 mt-2 border-t">
        <Button variant="outline" size="sm" disabled className="text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1.5"
          >
            <path d="m3 3 3 9-3 9 19-9Z" />
            <path d="M6 12h16" />
          </svg>
          Kirim Pesan Uji
        </Button>
        <Button variant="outline" size="sm" disabled className="text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1.5"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          Putuskan Koneksi
        </Button>
      </CardFooter>
    </Card>
  )
}
