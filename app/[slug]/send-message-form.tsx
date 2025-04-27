"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Send } from "lucide-react"

interface User {
  id: string
  name: string
  username: string | null
  is_premium: boolean
  numeric_id: number
}

interface SendMessageFormProps {
  user: User
}

export function SendMessageForm({ user }: SendMessageFormProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const maxLength = 500
  const supabase = createClient()
  const { toast } = useToast()

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
      setCharacterCount(value.length)
    }
  }

  const checkRateLimit = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/rate-limit/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setRateLimitError(data.reason || "Terlalu banyak permintaan. Coba lagi nanti.")
        return false
      }

      setRateLimitError(null)
      return data.allowed
    } catch (error) {
      console.error("Error checking rate limit:", error)
      setRateLimitError("Terjadi kesalahan saat memeriksa batas pengiriman. Coba lagi nanti.")
      return false
    }
  }

  // Fungsi untuk memicu notifikasi
  const triggerNotification = async (messageId: string) => {
    try {
      const response = await fetch("/api/notifications/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          messageId: messageId,
          type: "new_message",
        }),
      })

      if (!response.ok) {
        console.error("Failed to trigger notification:", await response.text())
      }
    } catch (error) {
      console.error("Error triggering notification:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast({
        title: "Pesan tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)

    try {
      // Periksa rate limit sebelum mengirim pesan
      const isAllowed = await checkRateLimit()

      if (!isAllowed) {
        toast({
          title: "Gagal mengirim pesan",
          description: rateLimitError || "Anda telah mencapai batas pengiriman pesan. Coba lagi nanti.",
          variant: "destructive",
        })
        return
      }

      // Kirim pesan ke database
      const { data, error } = await supabase
        .from("messages")
        .insert({
          content: message,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Trigger notifikasi jika pesan berhasil dikirim
      if (data && data.id) {
        await triggerNotification(data.id)
      }

      // Laporkan rate limit
      try {
        await fetch("/api/rate-limit/report", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientId: user.id,
          }),
        })
      } catch (error) {
        console.error("Error reporting rate limit:", error)
      }

      toast({
        title: "Pesan terkirim!",
        description: "Pesan anonim Anda telah berhasil terkirim.",
      })

      setMessage("")
      setCharacterCount(0)
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Gagal mengirim pesan",
        description: error.message || "Terjadi kesalahan saat mengirim pesan",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="neo-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Kirim Pesan Anonim</CardTitle>
        <CardDescription>Kirim pesan anonim ke {user.name || `@${user.username || user.numeric_id}`}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Tulis pesan anonim Anda di sini..."
              value={message}
              onChange={handleMessageChange}
              className="min-h-[120px] resize-none"
              maxLength={maxLength}
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${characterCount > maxLength * 0.8 ? "text-orange-500" : "text-muted-foreground"}`}
              >
                {characterCount}/{maxLength}
              </span>
            </div>
          </div>
          {rateLimitError && <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md">{rateLimitError}</div>}
          <Button type="submit" className="w-full neo-btn" disabled={isSending || !message.trim()}>
            {isSending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Mengirim...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Kirim Pesan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
