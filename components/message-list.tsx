"use client"

import { formatDistanceToNow } from "date-fns"
import type { Database } from "@/lib/supabase/database.types"
import { MessageReplyForm } from "./message-reply-form"
import { MessageSquare, Trash2, Share2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "./pagination"
import html2canvas from "html2canvas"
import { PublicRepliesList } from "./public-replies-list"

type Message = Database["public"]["Tables"]["messages"]["Row"]

interface MessageListProps {
  messages: Message[]
  hideReadStatus?: boolean
  isPremium?: boolean
  onReplySuccess?: () => void
  onDeleteSuccess?: () => void
  enableSharing?: boolean
  enablePublicReplies?: boolean
  isPublicView?: boolean
  username?: string | null
  numericId?: number
}

export function MessageList({
  messages,
  hideReadStatus = false,
  isPremium = false,
  onReplySuccess,
  onDeleteSuccess,
  enableSharing = false,
  enablePublicReplies = false,
  isPublicView = false,
  username,
  numericId,
}: MessageListProps) {
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sharingMessage, setSharingMessage] = useState<string | null>(null)
  const messagesPerPage = 10
  const supabase = createClient()
  const { toast } = useToast()

  // Calculate pagination values
  const totalPages = Math.ceil(messages.length / messagesPerPage)
  const startIndex = (currentPage - 1) * messagesPerPage
  const endIndex = startIndex + messagesPerPage
  const currentMessages = messages.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Reset any editing or replying state when changing pages
    setEditingReply(null)
    setReplyingTo(null)
  }

  // Handle share message
  const handleShareMessage = async (messageId: string) => {
    setSharingMessage(messageId)
    try {
      const messageElement = document.getElementById(`message-${messageId}`)
      if (!messageElement) {
        throw new Error("Message element not found")
      }

      // Get the original dimensions
      const originalWidth = messageElement.offsetWidth
      const originalHeight = messageElement.offsetHeight

      // Clone the element to remove share buttons
      const clone = messageElement.cloneNode(true) as HTMLElement
      const shareButtons = clone.querySelectorAll(".share-button")
      shareButtons.forEach((btn) => {
        btn.parentNode?.removeChild(btn)
      })

      // Enhance badge styling for capture
      const badges = clone.querySelectorAll('[class*="Badge"], [class*="badge"]')
      badges.forEach((badge) => {
        const badgeElement = badge as HTMLElement

        // Tambahkan kelas khusus untuk styling yang konsisten
        badgeElement.classList.add("capture-badge")

        // Terapkan styling inline yang lebih lengkap
        badgeElement.style.padding = "4px 10px"
        badgeElement.style.backgroundColor = "#f3f4f6"
        badgeElement.style.borderColor = "#d1d5db"
        badgeElement.style.color = "#374151"
        badgeElement.style.fontWeight = "500"
        badgeElement.style.borderRadius = "6px"
        badgeElement.style.fontSize = "12px"
        badgeElement.style.lineHeight = "1.5"
        badgeElement.style.display = "inline-flex"
        badgeElement.style.alignItems = "center"
        badgeElement.style.justifyContent = "center"
        badgeElement.style.border = "1px solid #d1d5db"
        badgeElement.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)"
        badgeElement.style.whiteSpace = "nowrap"
        badgeElement.style.textTransform = "none"
        badgeElement.style.letterSpacing = "0"
      })

      // Tambahkan juga styling khusus untuk badge di bagian balasan
      const replyBadges = clone.querySelectorAll(".inline-flex.items-center.px-2\\.5.py-0\\.5")
      replyBadges.forEach((badge) => {
        const badgeElement = badge as HTMLElement
        badgeElement.classList.add("capture-reply-badge")
        badgeElement.style.backgroundColor = "#ffedd5" // Warna orange yang lebih terang
        badgeElement.style.color = "#9a3412" // Warna teks orange yang lebih gelap
        badgeElement.style.border = "1px solid #fdba74" // Border orange
        badgeElement.style.fontWeight = "500"
        badgeElement.style.padding = "4px 10px"
        badgeElement.style.borderRadius = "6px"
        badgeElement.style.fontSize = "12px"
        badgeElement.style.lineHeight = "1.5"
        badgeElement.style.display = "inline-flex"
        badgeElement.style.alignItems = "center"
        badgeElement.style.justifyContent = "center"
        badgeElement.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)"
      })

      // Enhance timestamp styling
      const timestamps = clone.querySelectorAll(".text-xs")
      timestamps.forEach((timestamp) => {
        const timeEl = timestamp as HTMLElement
        // Periksa apakah ini benar-benar timestamp dengan memeriksa konten atau posisi
        if (timeEl.textContent && timeEl.textContent.includes("yang lalu")) {
          timeEl.style.color = "#6b7280"
          timeEl.style.fontSize = "12px"
          timeEl.style.fontWeight = "400"
        }
      })

      // Enhance message content
      const messageContent = clone.querySelector("p.text-base")
      if (messageContent) {
        const contentEl = messageContent as HTMLElement
        contentEl.style.fontSize = "16px"
        contentEl.style.lineHeight = "1.6"
        contentEl.style.color = "#111827"
        contentEl.style.margin = "12px 0"
      }

      // Enhance reply section
      const replySection = clone.querySelector(".bg-gray-50.p-4.rounded-md")
      if (replySection) {
        const replySectionEl = replySection as HTMLElement
        replySectionEl.style.backgroundColor = "#f9fafb"
        replySectionEl.style.borderRadius = "8px"
        replySectionEl.style.padding = "16px"
        replySectionEl.style.marginTop = "16px"
        replySectionEl.style.border = "1px solid #e5e7eb"
      }

      // Create a wrapper with padding
      const wrapper = document.createElement("div")
      wrapper.style.position = "absolute"
      wrapper.style.left = "-9999px"
      wrapper.style.padding = "40px" // Add padding around the element
      wrapper.style.backgroundColor = "white" // White background
      wrapper.style.display = "inline-block"
      wrapper.style.borderRadius = "12px" // Rounded corners
      wrapper.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.1)" // Add subtle shadow

      // Set the clone's dimensions to match the original
      clone.style.width = `${originalWidth}px`
      clone.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)"

      // Cari kode watermark yang ada dalam fungsi handleShareMessage
      let watermark = document.createElement("div")
      watermark.style.position = "absolute"
      watermark.style.bottom = "12px"
      watermark.style.right = "12px"
      watermark.style.fontSize = "11px"
      watermark.style.color = "rgba(0, 0, 0, 0.3)"
      watermark.style.fontFamily = "Arial, sans-serif"
      watermark.style.pointerEvents = "none"
      watermark.textContent = "SecretMe"

      // Ganti dengan watermark yang lebih menarik
      watermark = document.createElement("div")
      watermark.style.position = "absolute"
      watermark.style.bottom = "12px"
      watermark.style.right = "12px"
      watermark.style.padding = "4px 8px"
      watermark.style.backgroundColor = "#fd9745"
      watermark.style.color = "#000000"
      watermark.style.fontFamily = "Arial, sans-serif"
      watermark.style.fontSize = "12px"
      watermark.style.fontWeight = "bold"
      watermark.style.borderRadius = "6px"
      watermark.style.border = "2px solid #000"
      watermark.style.boxShadow = "2px 2px 0px 0px #000"
      watermark.style.display = "flex"
      watermark.style.alignItems = "center"
      watermark.style.gap = "4px"
      watermark.style.pointerEvents = "none"
      watermark.style.zIndex = "999"

      // Tambahkan ikon dan teks
      watermark.innerHTML = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
  <span>SecretMe</span>
`

      // Append the clone to the wrapper
      wrapper.appendChild(clone)
      wrapper.appendChild(watermark)

      // Temporarily append the wrapper to the DOM
      document.body.appendChild(wrapper)

      // Generate canvas with higher quality
      const canvas = await html2canvas(wrapper, {
        scale: 4, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "white",
      })

      // Remove the wrapper
      document.body.removeChild(wrapper)

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png", 1.0)

      // Try to use Web Share API if available
      if (
        navigator.share &&
        navigator.canShare({
          files: [new File([await (await fetch(dataUrl)).blob()], `message-${messageId}.png`, { type: "image/png" })],
        })
      ) {
        await navigator.share({
          files: [new File([await (await fetch(dataUrl)).blob()], `message-${messageId}.png`, { type: "image/png" })],
          title: "Pesan dari SecretMe",
          text: "Pesan anonim dari SecretMe",
        })
      } else {
        // Fallback to download
        const url = URL.createObjectURL(await (await fetch(dataUrl)).blob())
        const a = document.createElement("a")
        a.href = url
        a.download = `secretme-message-${messageId}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error sharing message:", error)
      toast({
        title: "Gagal membagikan pesan",
        description: "Terjadi kesalahan saat membagikan pesan",
        variant: "destructive",
      })
    } finally {
      setSharingMessage(null)
    }
  }

  if (messages.length === 0) {
    return (
      <div className="neo-card p-6 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-base text-text">Belum ada pesan yang diterima</p>
        <p className="text-sm text-muted-foreground mt-1">Bagikan link profil Anda untuk mulai menerima pesan</p>
      </div>
    )
  }

  async function handleDeleteMessage(messageId: string) {
    setIsDeleting(messageId)
    try {
      const { error } = await supabase.from("messages").delete().eq("id", messageId)

      if (error) {
        throw error
      }

      toast({
        title: "Pesan dihapus",
        description: "Pesan berhasil dihapus",
      })

      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Gagal menghapus pesan",
        description: error.message || "Terjadi kesalahan saat menghapus pesan",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setMessageToDelete(null)
    }
  }

  function confirmDelete(messageId: string) {
    setMessageToDelete(messageId)
    setDeleteConfirmOpen(true)
  }

  // Define an array of color variants to cycle through
  const colorVariants = ["blue", "green", "purple", "pink", "amber", "teal", "indigo", "rose"]

  return (
    <>
      <div className="space-y-4">
        {currentMessages.map((message, index) => (
          <div key={message.id} className="relative" id={`message-${message.id}`}>
            <Card className="border-2 border-[var(--border)] shadow-[var(--shadow)]">
              <CardContent className="p-4" colorVariant={colorVariants[index % colorVariants.length]}>
                {/* Message Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-[var(--border-radius)]">
                      Anonim
                    </Badge>
                    <span className="text-xs text-[var(--text)]/50">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {isPremium && !isPublicView && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => confirmDelete(message.id)}
                      disabled={isDeleting === message.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Message Content */}
                <p className="text-base">{message.content}</p>

                {/* Reply section */}
                {message.reply && editingReply !== message.id && (
                  <>
                    <div className="border-t-[3px] border-[var(--border)] my-4"></div>
                    <div className="bg-gray-50 p-4 rounded-md border-2 border-[var(--border)]/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {/* Replace Badge with a custom div to avoid any hover/focus effects */}
                          <div className="inline-flex items-center px-2.5 py-0.5 bg-gradient-to-r from-amber-100 to-amber-200 border border-orange-200 rounded-[var(--border-radius)] text-black font-medium text-xs">
                            @{username || numericId || "pemilik"}
                          </div>
                          <span className="text-xs text-gray-600">Membalas</span>
                          <span className="text-xs text-[var(--text)]/50">
                            {formatDistanceToNow(new Date(message.updated_at), { addSuffix: true })}
                          </span>
                        </div>

                        {!isPublicView && onReplySuccess && (
                          <button
                            onClick={() => setEditingReply(message.id)}
                            className="text-xs text-green-600 hover:text-green-800 hover:underline bg-transparent border-none p-0"
                          >
                            Edit Balasan
                          </button>
                        )}
                      </div>
                      <p className="text-sm">{message.reply}</p>

                      {/* Public Replies Section - only show for messages with replies */}
                      {enablePublicReplies && message.reply && <PublicRepliesList messageId={message.id} />}
                    </div>
                  </>
                )}

                {/* Show reply button or form for users with no reply */}
                {!isPublicView && onReplySuccess && !message.reply && (
                  <div>
                    {replyingTo === message.id ? (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <MessageReplyForm
                          messageId={message.id}
                          existingReply={null}
                          onReplySuccess={() => {
                            setReplyingTo(null)
                            if (onReplySuccess) onReplySuccess()
                          }}
                          onCancel={() => setReplyingTo(null)}
                        />
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setReplyingTo(message.id)}
                          className="text-xs text-green-600 hover:text-green-800 hover:underline bg-transparent border-none p-0"
                        >
                          Balas Pesan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Show edit form when editing */}
                {!isPublicView && onReplySuccess && editingReply === message.id && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <MessageReplyForm
                      messageId={message.id}
                      existingReply={message.reply}
                      onReplySuccess={() => {
                        setEditingReply(null)
                        if (onReplySuccess) onReplySuccess()
                      }}
                      onCancel={() => setEditingReply(null)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share button - only shown if enableSharing is true */}
            {enableSharing && (
              <button
                onClick={() => handleShareMessage(message.id)}
                disabled={sharingMessage === message.id}
                className="share-button absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 rounded-md bg-white border-2 border-black"
                aria-label="Share message"
              >
                {sharingMessage === message.id ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-black rounded-md animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add pagination if there are more than one page */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-[90vw] w-[400px] neo-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pesan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0 neo-btn-outline">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
              className="bg-red-500 text-white neo-btn"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
