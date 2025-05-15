"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProfileImageDialog } from "@/components/profile-image-dialog"
import { FileText } from "lucide-react"

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
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      {children ? (
        <div onClick={() => setDialogOpen(true)}>{children}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 hover:border-blue-700 transition-colors"
          onClick={() => setDialogOpen(true)}
          aria-label="Bagikan profil sebagai gambar"
        >
          <FileText className="h-3.5 w-3.5 mr-1" />
          Bagikan
        </Button>
      )}

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
