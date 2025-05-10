"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { LoadingDots } from "@/components/loading-dots"
import { Sparkles } from "lucide-react"
import { SuccessAnimation } from "@/components/success-animation"

interface SendMessageFormProps {
  userId: string
  username: string
}

// Template pesan yang dapat dipilih pengunjung
const messageTemplates = [
  "Hai, saya suka konten yang kamu bagikan!",
  "Boleh kenalan lebih dekat?",
  "Kamu inspirasi banget!",
  "Semangat terus ya!",
  "Saya punya pertanyaan nih...",
  "Keren banget profilmu!",
]

export function SendMessageFormWithNotification({ userId, username }: SendMessageFormProps) {
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isLoading = isPending || isSubmitting

  const selectTemplate = (template: string) => {
    setMessage(template)
    setShowTemplates(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)

    try {
      // Verifikasi user terlebih dahulu jika ada session
      const { data: userData, error: userError } = await supabase.auth.getUser()

      // Jika ada error dalam verifikasi user, log error tapi tetap lanjutkan
      // karena pengiriman pesan anonim tidak memerlukan autentikasi
      if (userError) {
        console.error("User verification error:", userError.message)
      }

      // Check rate limit first
      const rateLimitResponse = await fetch("/api/rate-limit/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: userId,
        }),
      })

      const rateLimitData = await rateLimitResponse.json()

      if (!rateLimitResponse.ok) {
        throw new Error(rateLimitData.error || rateLimitData.reason || "Rate limit exceeded. Please try again later.")
      }

      // Send message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          content: message.trim(),
          user_id: userId,
        })
        .select()
        .single()

      if (messageError) {
        throw new Error(messageError.message)
      }

      // Report rate limit usage
      await fetch("/api/rate-limit/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: userId,
        }),
      })

      // Trigger notification
      if (messageData) {
        try {
          console.log("Triggering notification for message:", messageData.id)
          const notifResponse = await fetch("/api/notifications/trigger", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              messageId: messageData.id,
              type: "new_message",
            }),
          })

          const notifResult = await notifResponse.json()
          console.log("Notification trigger response:", notifResult)

          if (!notifResponse.ok) {
            console.error("Notification trigger failed:", notifResult)
          }
        } catch (notificationError) {
          console.error("Failed to trigger notification:", notificationError)
          // Don't throw error here, we still want to show success message
        }
      }

      // Tampilkan animasi sukses
      setShowSuccess(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim pesan. Silakan coba lagi.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handleAnimationComplete = () => {
    setShowSuccess(false)
    setIsSubmitting(false)
    setMessage("")

    // Refresh the page
    startTransition(() => {
      router.refresh()
    })
  }

  if (showSuccess) {
    return <SuccessAnimation onComplete={handleAnimationComplete} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Textarea
          placeholder={`Kirim pesan anonim ke ${username}...`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[120px] resize-none"
          disabled={isLoading}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
          onClick={() => setShowTemplates(!showTemplates)}
          title="Gunakan template pesan"
          disabled={isLoading}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {showTemplates && (
        <div className="bg-white rounded-md shadow-md p-2 border border-gray-200 mt-1 max-h-[200px] overflow-y-auto">
          <div className="text-sm font-medium mb-2 text-gray-500">Pilih Template Pesan:</div>
          <div className="space-y-1">
            {messageTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                onClick={() => selectTemplate(template)}
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoadingDots /> : "Kirim Pesan"}
      </Button>
    </form>
  )
}
