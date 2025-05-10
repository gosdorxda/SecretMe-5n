"use client"

import { formatDistanceToNow } from "date-fns"
import id from "date-fns/locale/id"
import type { Database } from "@/lib/supabase/database.types"
import { MessageReplyForm } from "./message-reply-form"
import { MessageSquare, Trash2, Share } from "lucide-react"
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
import { Pagination } from "./pagination"
import { PublicRepliesList } from "./public-replies-list"
import { ShareImageDialog } from "./share-image-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
  displayName?: string | null
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
  displayName,
}: MessageListProps) {
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [messageToShare, setMessageToShare] = useState<Message | null>(null)

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

  // Open share dialog
  const openShareDialog = (message: Message) => {
    setMessageToShare(message)
    setShareDialogOpen(true)
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
                    <Avatar className="h-6 w-6 border border-[var(--border)]">
                      <AvatarFallback className="bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 text-gray-600">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.11241 7.82201C9.44756 6.83666 10.5551 6 12 6C13.7865 6 15 7.24054 15 8.5C15 9.75946 13.7865 11 12 11C11.4477 11 11 11.4477 11 12L11 14C11 14.5523 11.4477 15 12 15C12.5523 15 13 14.5523 13 14L13 12.9082C15.203 12.5001 17 10.7706 17 8.5C17 5.89347 14.6319 4 12 4C9.82097 4 7.86728 5.27185 7.21894 7.17799C7.0411 7.70085 7.3208 8.26889 7.84366 8.44673C8.36653 8.62458 8.93457 8.34488 9.11241 7.82201ZM12 20C12.8285 20 13.5 19.3284 13.5 18.5C13.5 17.6716 12.8285 17 12 17C11.1716 17 10.5 17.6716 10.5 18.5C10.5 19.3284 11.1716 20 12 20Z"
                            fill="currentColor"
                          />
                        </svg>
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-baseline">
                      <span className="text-sm font-semibold text-[var(--text)]">Anonim</span>
                      <span className="mx-1.5 text-xs text-[var(--text)]/50">·</span>
                      <span className="text-[0.65rem] text-[var(--text)]/50">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: id })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share button */}
                    {enableSharing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-gray-600 hover:bg-transparent"
                        onClick={() => openShareDialog(message)}
                      >
                        <Share className="h-3.5 w-3.5 mr-1" />
                        Bagikan
                      </Button>
                    )}

                    {/* Delete button */}
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
                          <span className="text-[0.65rem] text-[var(--text)]/50">
                            {formatDistanceToNow(new Date(message.updated_at), { addSuffix: true, locale: id })}
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
          </div>
        ))}
      </div>

      {/* Add pagination if there are more than one page */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* Delete Confirmation Dialog */}
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

      {/* Share Image Dialog */}
      {messageToShare && (
        <ShareImageDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          username={username || `user${numericId}` || "anonymous"}
          message={messageToShare.content}
          date={formatDistanceToNow(new Date(messageToShare.created_at), { addSuffix: true, locale: id })}
          avatarUrl={null} // Bisa ditambahkan avatar URL jika tersedia
          displayName={displayName} // Tambahkan displayName ke dialog
        />
      )}
    </>
  )
}
