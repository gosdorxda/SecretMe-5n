"use client"

import type React from "react"

import { useState } from "react"
import { ProfileImageDialog } from "@/components/profile-image-dialog"

interface ProfileImageButtonProps {
  username: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  isPremium?: boolean
  variant?: "blue" | "default"
  children?: React.ReactNode
  locale?: string
}

export function ProfileImageButton({
  username,
  displayName,
  bio,
  avatarUrl,
  isPremium,
  variant = "default",
  children,
  locale = "id",
}: ProfileImageButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {children}
      </div>

      <ProfileImageDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        username={username}
        displayName={displayName}
        bio={bio}
        avatarUrl={avatarUrl}
        isPremium={isPremium}
        locale={locale}
      />
    </>
  )
}
