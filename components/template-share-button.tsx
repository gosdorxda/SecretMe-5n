"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShareImageDialog } from "@/components/share-image-dialog"
import { ImageIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TemplateShareButtonProps {
  username: string
  message: string
  date: string
  avatarUrl?: string | null
  className?: string
}

export function TemplateShareButton({ username, message, date, avatarUrl, className }: TemplateShareButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="h-7 px-2 text-xs text-gray-600 hover:bg-transparent"
            >
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
              Bagikan
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bagikan pesan sebagai gambar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
