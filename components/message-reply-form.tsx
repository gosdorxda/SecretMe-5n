"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

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
  const { locale } = useLanguage()

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

      toast({
        title: existingReply
          ? locale === "en"
            ? "Reply updated"
            : "Balasan diperbarui"
          : locale === "en"
            ? "Reply sent"
            : "Balasan terkirim",
        description: existingReply
          ? locale === "en"
            ? "Your reply has been successfully updated"
            : "Balasan Anda telah berhasil diperbarui"
          : locale === "en"
            ? "Your reply has been successfully saved"
            : "Balasan Anda telah berhasil disimpan",
      })

      onReplySuccess()
    } catch (error: any) {
      console.error(error)
      toast({
        title: existingReply
          ? locale === "en"
            ? "Failed to update reply"
            : "Gagal memperbarui balasan"
          : locale === "en"
            ? "Failed to send reply"
            : "Gagal mengirim balasan",
        description: error.message || (locale === "en" ? "An error occurred" : "Terjadi kesalahan"),
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
        <p className="text-sm font-medium text-green-700">
          {existingReply
            ? locale === "en"
              ? "Edit reply:"
              : "Edit balasan:"
            : locale === "en"
              ? "Reply to this message:"
              : "Balas pesan ini:"}
        </p>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600"
          aria-label={locale === "en" ? "Close reply form" : "Tutup form balasan"}
        >
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
        placeholder={locale === "en" ? "Write your reply..." : "Tulis balasan Anda..."}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        className="neo-input resize-none text-xs sm:text-sm focus-visible:ring-green-500"
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel} className="text-xs neo-btn-outline">
          {locale === "en" ? "Cancel" : "Batal"}
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
              {locale === "en" ? "Sending..." : "Mengirim..."}
            </>
          ) : existingReply ? (
            locale === "en" ? (
              "Update"
            ) : (
              "Perbarui"
            )
          ) : locale === "en" ? (
            "Send Reply"
          ) : (
            "Kirim Balasan"
          )}
        </Button>
      </div>
    </div>
  )
}
