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
        className="flex items-center gap-1 rounded-md bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 transition-all duration-200 px-2 py-1 h-8"
        onClick={() => setDialogOpen(true)}
        aria-label="Bagikan profil sebagai gambar"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span className="text-xs">Bagikan</span>
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
