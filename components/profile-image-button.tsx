"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ImageIcon } from "lucide-react"
import { ProfileImageDialog } from "./profile-image-dialog"

interface ProfileImageButtonProps {
  username: string
  displayName?: string
  bio?: string
  avatarUrl?: string | null
  isPremium?: boolean
}

export function ProfileImageButton({ username, displayName, bio, avatarUrl, isPremium }: ProfileImageButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-gray-600 hover:bg-transparent"
        onClick={() => setDialogOpen(true)}
        aria-label="Bagikan profil sebagai gambar"
      >
        <ImageIcon className="h-3.5 w-3.5 mr-1" />
        Bagikan
      </Button>

      <ProfileImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        username={username}
        displayName={displayName}
        bio={bio}
        avatarUrl={avatarUrl}
        isPremium={isPremium}
      />
    </>
  )
}
