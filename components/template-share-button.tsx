"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShareImageDialog } from "@/components/share-image-dialog"
import { ImageIcon } from "lucide-react"

interface TemplateShareButtonProps {
  username: string
  message: string
  date: string
  avatarUrl?: string | null
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function TemplateShareButton({
  username,
  message,
  date,
  avatarUrl,
  variant = "outline",
  size = "sm",
  className,
}: TemplateShareButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className={className}
        title="Bagikan sebagai gambar"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <ShareImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        username={username}
        message={message}
        date={date}
        avatarUrl={avatarUrl}
      />
    </>
  )
}
