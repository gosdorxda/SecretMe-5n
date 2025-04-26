"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { LoadingDots } from "@/components/loading-dots"

interface SendMessageFormProps {
  userId: string
  username: string
}

export function SendMessageFormWithNotification({ userId, username }: SendMessageFormProps) {
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isLoading = isPending || isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)

    try {
      // Check rate limit first
      const rateLimitResponse = await fetch("/api/rate-limit/check")
      const rateLimitData = await rateLimitResponse.json()

      if (!rateLimitResponse.ok) {
        throw new Error(rateLimitData.error || "Rate limit exceeded. Please try again later.")
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
      })

      // Trigger notification
      if (messageData) {
        try {
          console.log("Triggering notification for message:", messageData.id)
          const notificationResponse = await fetch("/api/notifications/trigger", {
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

          if (!notificationResponse.ok) {
            const notificationResult = await notificationResponse.json()
            console.error("Notification error:", notificationResult)
            throw new Error(notificationResult.error || "Failed to send notification")
          }

          const notificationResult = await notificationResponse.json()
          console.log("Notification result:", notificationResult)
        } catch (notificationError: any) {
          console.error("Failed to trigger notification:", notificationError)
          // Log error but don't throw, we still want to show success message
          toast({
            title: "Pesan terkirim, tetapi notifikasi gagal",
            description: notificationError.message || "Terjadi kesalahan saat mengirim notifikasi",
            variant: "destructive",
          })
        }
      }

      toast({
        title: "Pesan terkirim!",
        description: "Pesan Anda telah berhasil terkirim.",
      })

      setMessage("")

      // Refresh the page
      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim pesan. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder={`Kirim pesan anonim ke ${username}...`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[120px] resize-none"
        disabled={isLoading}
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <LoadingDots /> : "Kirim Pesan"}
      </Button>
    </form>
  )
}
