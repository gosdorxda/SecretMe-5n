"use client"

import { formatDistanceToNow } from "date-fns"
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
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-[var(--border)]">
                        <AvatarFallback className="bg-gray-100">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-4 w-4 text-gray-600">
                            <path
                              d="M24.36,31h-0.72v-7.492c0-3.556-2.414-6.612-5.872-7.432c-0.15-0.036-0.261-0.163-0.275-0.316
      c-0.015-0.154,0.071-0.3,0.212-0.363c1.517-0.675,2.496-2.181,2.496-3.836c0-2.316-1.884-4.201-4.2-4.201S11.8,9.244,11.8,11.561
      c0,1.655,0.98,3.162,2.496,3.836c0.141,0.063,0.227,0.209,0.212,0.363c-0.014,0.153-0.125,0.281-0.275,0.316
      c-3.458,0.82-5.872,3.876-5.872,7.432V31H7.64v-7.492c0-3.597,2.257-6.725,5.585-7.887c-1.326-0.907-2.146-2.421-2.146-4.061
      c0-1.964,1.157-3.664,2.826-4.452C14.101,6.617,14.2,6.097,14.2,5.561c0-2.316-1.884-4.201-4.2-4.201
      c-2.355,0-4.201,1.819-4.201,4.14c0,1.666,1.003,3.232,2.496,3.897C8.437,9.46,8.522,9.606,8.507,9.76
      c-0.014,0.153-0.125,0.281-0.275,0.316C4.774,10.896,2.36,13.948,2.36,17.5V25H1.64v-7.5c0-3.594,2.259-6.721,5.591-7.881
      C5.917,8.705,5.08,7.144,5.08,5.5c0-2.68,2.207-4.86,4.92-4.86s4.92,2.207,4.92,4.92c0,0.422-0.052,0.836-0.157,1.237
      c0.791-0.205,1.683-0.205,2.473,0c-0.104-0.401-0.157-0.815-0.157-1.237c0-2.713,2.208-4.92,4.921-4.92
      c2.726,0,4.86,2.135,4.86,4.86c0,1.68-0.799,3.215-2.093,4.119c3.333,1.159,5.593,4.287,5.593,7.881V25h-0.72v-7.5
      c0-3.552-2.414-6.604-5.872-7.424c-0.15-0.036-0.261-0.163-0.275-0.316c-0.015-0.154,0.071-0.3,0.212-0.363
      C25.184,8.738,26.14,7.208,26.14,5.5c0-2.321-1.818-4.14-4.14-4.14c-2.316,0-4.2,1.884-4.2,4.201c0,0.536,0.099,1.056,0.295,1.548
      c1.669,0.789,2.826,2.488,2.826,4.452c0,1.64-0.82,3.154-2.146,4.061c3.329,1.162,5.586,4.29,5.586,7.887L24.36,31L24.36,31z
      M16.5,28c0-0.276-0.224-0.5-0.5-0.5c-0.276,0-0.5,0.224-0.5,0.5s0.224,0.5,0.5,0.5C16.276,28.5,16.5,28.276,16.5,28z
      M17.241,24.812c0.498-0.371,1.119-0.833,1.119-1.994c0-1.262-0.992-2.178-2.36-2.178c-1.302,0-2.36,1.062-2.36,2.369h0.72
      c0-0.909,0.736-1.648,1.641-1.648c0.965,0,1.639,0.599,1.639,1.457c0,0.8-0.348,1.059-0.829,1.417
      c-0.524,0.39-1.175,0.875-1.175,2.152h0.72C16.355,25.471,16.746,25.18,17.241,24.812z"
                            />
                          </svg>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center text-xs">
                        <span className="font-medium text-[var(--text)]">Anonim</span>
                        <span className="mx-1.5 text-[var(--text)]/50">·</span>
                        <span className="text-[var(--text)]/50">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Share button */}
                    {enableSharing && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-7 px-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openShareDialog(message)}
                      >
                        <Share className="h-3.5 w-3.5" />
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
          date={formatDistanceToNow(new Date(messageToShare.created_at), { addSuffix: true })}
          avatarUrl={null} // Bisa ditambahkan avatar URL jika tersedia
        />
      )}
    </>
  )
}
