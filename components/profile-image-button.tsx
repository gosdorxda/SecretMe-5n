"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ShareImageDialog } from "@/components/share-image-dialog"

interface ProfileImageButtonProps {
  username: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  isPremium?: boolean
  children?: React.ReactNode
}

export function ProfileImageButton({
  username,
  displayName,
  bio,
  avatarUrl,
  isPremium,
  children,
}: ProfileImageButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div data-profile-image-button>
          {children || (
            <Button variant="outline" size="sm" className="text-xs">
              Bagikan Gambar Profil
            </Button>
          )}
        </div>
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
