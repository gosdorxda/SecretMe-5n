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
        className="flex items-center gap-2 rounded-[var(--border-radius)] bg-gradient-to-br from-purple-500 to-pink-500 text-white border-2 border-border shadow-neo-sm hover:shadow-none transition-all duration-200 px-3 py-1 h-9"
        onClick={() => setDialogOpen(true)}
        aria-label="Bagikan profil sebagai gambar"
      >
        <ImageIcon className="h-4 w-4" />
        <span className="text-sm">Bagikan Profil</span>
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
