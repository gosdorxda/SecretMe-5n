"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { enUS } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { PublicReplyForm } from "./public-reply-form"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/language-context"

interface PublicReply {
  id: string
  message_id: string
  content: string
  author_name: string
  created_at: string
}

interface PublicRepliesListProps {
  messageId: string
  userId?: string
}

export function PublicRepliesList({ messageId, userId }: PublicRepliesListProps) {
  const [replies, setReplies] = useState<PublicReply[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllReplies, setShowAllReplies] = useState(false)
  const [allowPublicReplies, setAllowPublicReplies] = useState(true) // Default to true
  const supabase = createClient()
  const { locale } = useLanguage()

  // Jumlah balasan yang ditampilkan secara default
  const defaultDisplayCount = 3

  // Fungsi untuk memuat balasan publik
  const fetchReplies = async () => {
    setLoading(true)
    try {
      // Jika userId disediakan, periksa pengaturan allow_public_replies
      if (userId) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("allow_public_replies")
            .eq("id", userId)
            .single()

          if (userError) {
            // Si el error es porque la columna no existe, mantenemos el valor predeterminado (true)
            if (userError.message?.includes("column") && userError.message?.includes("does not exist")) {
              console.warn("Column allow_public_replies does not exist yet, using default value (true)")
            } else {
              console.error("Error fetching user settings:", userError)
            }
          } else if (
            userData &&
            userData.allow_public_replies !== null &&
            userData.allow_public_replies !== undefined
          ) {
            // Solo actualizamos si el valor existe y no es null/undefined
            setAllowPublicReplies(userData.allow_public_replies)
          }
        } catch (error) {
          console.error("Error checking user settings:", error)
          // Mantenemos el valor predeterminado en caso de error
        }
      } else {
        // Jika tidak ada userId, kita perlu mendapatkan user_id dari pesan
        try {
          const { data: messageData, error: messageError } = await supabase
            .from("messages")
            .select("user_id")
            .eq("id", messageId)
            .single()

          if (messageError) {
            console.error("Error fetching message:", messageError)
          } else if (messageData) {
            // Dapatkan pengaturan allow_public_replies dari user
            try {
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("allow_public_replies")
                .eq("id", messageData.user_id)
                .single()

              if (userError) {
                // Si el error es porque la columna no existe, mantenemos el valor predeterminado (true)
                if (userError.message?.includes("column") && userError.message?.includes("does not exist")) {
                  console.warn("Column allow_public_replies does not exist yet, using default value (true)")
                } else {
                  console.error("Error fetching user settings:", userError)
                }
              } else if (
                userData &&
                userData.allow_public_replies !== null &&
                userData.allow_public_replies !== undefined
              ) {
                // Solo actualizamos si el valor existe y no es null/undefined
                setAllowPublicReplies(userData.allow_public_replies)
              }
            } catch (error) {
              console.error("Error checking user settings:", error)
              // Mantenemos el valor predeterminado en caso de error
            }
          }
        } catch (error) {
          console.error("Error fetching message data:", error)
        }
      }

      // Ambil balasan publik
      const { data, error } = await supabase
        .from("public_replies")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: true })

      if (error) {
        // Verificar si el error es porque la tabla no existe
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          console.error("Table public_replies does not exist. Please run the SQL script to create it.")
          // Establecer un array vacío como respuestas para evitar errores
          setReplies([])
        } else {
          throw error
        }
      } else {
        setReplies(data || [])
      }
    } catch (error) {
      console.error("Error fetching public replies:", error)
      // Establecer un array vacío como respuestas para evitar errores
      setReplies([])
    } finally {
      setLoading(false)
    }
  }

  // Muat balasan saat komponen dimount
  useEffect(() => {
    fetchReplies()
  }, [messageId])

  // Callback setelah mengirim balasan baru
  const handleReplySuccess = () => {
    fetchReplies()
  }

  // Tampilkan loading state
  if (loading) {
    return (
      <div className="mt-3 text-center py-3">
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="text-xs text-gray-500 mt-2">{locale === "en" ? "Loading replies..." : "Memuat balasan..."}</p>
      </div>
    )
  }

  // Tampilkan form jika tidak ada balasan dan balasan publik diizinkan
  if (!replies || replies.length === 0) {
    return allowPublicReplies ? <PublicReplyForm messageId={messageId} onReplySuccess={handleReplySuccess} /> : null
  }

  // Tentukan balasan yang akan ditampilkan
  const displayedReplies = showAllReplies ? replies : replies.slice(0, defaultDisplayCount)
  const hasMoreReplies = replies.length > defaultDisplayCount

  return (
    <div className="mt-3">
      <div className={`flex items-center mb-2 ${replies.length > 0 ? "pb-2 border-b-2 border-gray-200" : ""}`}>
        <span className="text-xs text-gray-600">
          {locale === "en" ? "Public Replies" : "Balasan Publik"} ({replies.length})
        </span>
      </div>

      <div className="space-y-3">
        {displayedReplies.map((reply) => (
          <div key={reply.id} className="bg-white p-3 rounded-md border border-gray-200">
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm">{reply.author_name}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(reply.created_at), {
                  addSuffix: true,
                  locale: locale === "en" ? enUS : id,
                })}
              </span>
            </div>
            <p className="text-sm">{reply.content}</p>
          </div>
        ))}
      </div>

      {hasMoreReplies && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllReplies(!showAllReplies)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 w-full"
        >
          {showAllReplies
            ? locale === "en"
              ? "Hide some replies"
              : "Sembunyikan sebagian balasan"
            : locale === "en"
              ? `View ${replies.length - defaultDisplayCount} more ${replies.length - defaultDisplayCount === 1 ? "reply" : "replies"}`
              : `Lihat ${replies.length - defaultDisplayCount} balasan lainnya`}
        </Button>
      )}

      {allowPublicReplies && <PublicReplyForm messageId={messageId} onReplySuccess={handleReplySuccess} />}
    </div>
  )
}
