"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ShareImageDialog } from "@/components/share-image-dialog"
import { FileText } from "lucide-react"

interface ProfileImageButtonProps {
  username: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  isPremium?: boolean
  children?: React.ReactNode
  buttonText?: string
  buttonClassName?: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function ProfileImageButton({
  username,
  displayName,
  bio,
  avatarUrl,
  isPremium,
  children,
  buttonText = "Bagikan Gambar Profil",
  buttonClassName = "",
  buttonVariant = "outline",
}: ProfileImageButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={buttonVariant} size="sm" className={buttonClassName}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <ShareImageDialog
          username={username}
          displayName={displayName}
          bio={bio}
          avatarUrl={avatarUrl}
          isPremium={isPremium}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
