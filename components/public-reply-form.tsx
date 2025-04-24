"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface PublicReplyFormProps {
  messageId: string
  onReplySuccess: () => void
}

export function PublicReplyForm({ messageId, onReplySuccess }: PublicReplyFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Validasi input - hanya perlu validasi konten
  const isValid = content.trim().length > 0

  // Modificar la función handleSubmit para manejar el error cuando la tabla no existe
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!content.trim()) return

    setIsSubmitting(true)

    try {
      // Intentar enviar la respuesta pública a la base de datos
      const { error } = await supabase.from("public_replies").insert({
        message_id: messageId,
        content: content.trim(),
        author_name: "Anonim", // Usar "Anonim" como nombre por defecto
        created_at: new Date().toISOString(),
      })

      if (error) {
        // Verificar si el error es porque la tabla no existe
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          toast({
            title: "Fitur belum tersedia",
            description: "Fitur balasan publik sedang dalam pengembangan. Silakan coba lagi nanti.",
            variant: "destructive",
          })
        } else {
          throw error
        }
      } else {
        // Reset form
        setContent("")
        setIsExpanded(false)

        // Notifikasi sukses
        toast({
          title: "Balasan terkirim",
          description: "Balasan publik Anda telah berhasil dikirim",
        })

        // Callback untuk refresh data
        onReplySuccess()
      }
    } catch (error: any) {
      console.error("Error submitting public reply:", error)
      toast({
        title: "Gagal mengirim balasan",
        description: error.message || "Terjadi kesalahan saat mengirim balasan",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-3">
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-700 opacity-80 hover:opacity-100 transition-opacity"
        >
          <span>Tambahkan balasan publik</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 bg-blue-50/50 p-3 rounded-md border border-blue-100">
          <div>
            <Textarea
              placeholder="Tulis balasan Anda..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-sm resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-right text-gray-500 mt-1">{content.length}/500</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsExpanded(false)} className="text-xs">
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isValid || isSubmitting}
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Balasan"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
