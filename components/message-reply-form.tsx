"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface MessageReplyFormProps {
  messageId: string
  existingReply: string | null
  onReplySuccess: () => void
  onCancel?: () => void
}

export function MessageReplyForm({ messageId, existingReply, onReplySuccess, onCancel }: MessageReplyFormProps) {
  const [reply, setReply] = useState(existingReply || "")
  const [isReplying, setIsReplying] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  async function handleSubmitReply() {
    if (!reply.trim()) return

    setIsReplying(true)

    try {
      // Update the message with the reply
      const { data: updatedMessage, error } = await supabase
        .from("messages")
        .update({
          reply: reply,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .select("user_id")
        .single()

      if (error) {
        throw error
      }

      // Manually log notification since the trigger is disabled
      if (updatedMessage) {
        try {
          await supabase.from("notification_logs").insert({
            user_id: updatedMessage.user_id,
            message_id: messageId,
            notification_type: existingReply ? "reply_updated" : "new_reply",
            channel: "app",
            status: "pending",
            created_at: new Date().toISOString(),
          })
        } catch (notifError) {
          console.error("Failed to log notification:", notifError)
          // Continue even if notification logging fails
        }

        // Trigger notification for message reply
        try {
          await fetch("/api/notifications/trigger", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: updatedMessage.user_id,
              messageId: messageId,
              type: "message_reply",
            }),
          })
        } catch (notificationError) {
          console.error("Failed to trigger notification:", notificationError)
          // Don't throw error here, we still want to show success message
        }
      }

      toast({
        title: existingReply ? "Balasan diperbarui" : "Balasan terkirim",
        description: existingReply ? "Balasan Anda telah berhasil diperbarui" : "Balasan Anda telah berhasil disimpan",
      })

      onReplySuccess()
    } catch (error: any) {
      console.error(error)
      toast({
        title: existingReply ? "Gagal memperbarui balasan" : "Gagal mengirim balasan",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsReplying(false)
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel()
    } else {
      onReplySuccess()
    }
  }

  return (
    <div className="space-y-3 bg-green-50/50 p-4 rounded-lg border-2 border-green-200/60 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-green-700">{existingReply ? "Edit balasan:" : "Balas pesan ini:"}</p>
        <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600" aria-label="Tutup form balasan">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <Textarea
        placeholder="Tulis balasan Anda..."
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        className="neo-input resize-none text-xs sm:text-sm focus-visible:ring-green-500"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel} className="text-xs neo-btn-outline">
          Batal
        </Button>
        <Button
          size="sm"
          onClick={handleSubmitReply}
          disabled={isReplying || !reply.trim()}
          className="text-xs neo-btn bg-green-600 hover:bg-green-700"
        >
          {isReplying ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Mengirim...
            </>
          ) : existingReply ? (
            "Perbarui"
          ) : (
            "Kirim Balasan"
          )}
        </Button>
      </div>
    </div>
  )
}
