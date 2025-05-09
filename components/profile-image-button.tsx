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
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        aria-label="Bagikan profil sebagai gambar"
      >
        <ImageIcon className="h-4 w-4 mr-1" />
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
