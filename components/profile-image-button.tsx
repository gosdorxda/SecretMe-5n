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
        size="icon"
        className="rounded-full h-8 w-8 absolute bottom-0 right-0 bg-white border-2 border-black shadow-md z-10"
        onClick={() => setDialogOpen(true)}
        title="Bagikan profil sebagai gambar"
      >
        <ImageIcon className="h-4 w-4" />
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
