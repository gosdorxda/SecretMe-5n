"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ShareImageDialog } from "./share-image-dialog"

interface TemplateShareButtonProps {
  username: string
  message: string
  date: Date | string
  avatarUrl?: string | null
  className?: string
}

export function TemplateShareButton({ username, message, date, avatarUrl, className }: TemplateShareButtonProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  // Format date if it's a Date object
  const formattedDate = typeof date === "string" ? date : formatDate(date)

  return (
    <>
      <Button variant="outline" size="sm" className={className} onClick={() => setShareDialogOpen(true)}>
        <Share className="mr-2 h-4 w-4" />
        Bagikan sebagai Gambar
      </Button>

      <ShareImageDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        username={username}
        message={message}
        date={formattedDate}
        avatarUrl={avatarUrl}
      />
    </>
  )
}
