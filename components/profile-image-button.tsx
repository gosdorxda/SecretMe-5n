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
  variant?: "default" | "blue" | "ghost" // Support ghost variant
  locale?: string // Add locale prop
}

export function ProfileImageButton({
  username,
  displayName,
  bio,
  avatarUrl,
  isPremium,
  children,
  variant = "default",
  locale = "id",
}: ProfileImageButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Define style based on variant
  let buttonStyle = ""

  if (variant === "blue") {
    buttonStyle =
      "h-6 px-2 text-xs bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 hover:border-blue-700 transition-colors"
  } else if (variant === "ghost") {
    // Clearer ghost style - no border, transparent, with hover effect
    buttonStyle = "h-6 px-2 text-xs bg-transparent hover:bg-gray-100 text-gray-700 shadow-none border-none"
  } else {
    // Default style
    buttonStyle = "h-6 px-2 text-xs border border-gray-300 bg-white text-gray-700"
  }

  return (
    <>
      {children ? (
        <div onClick={() => setDialogOpen(true)}>{children}</div>
      ) : (
        <Button
          // Use variant="ghost" directly from shadcn if variant is ghost
          variant={variant === "ghost" ? "ghost" : "outline"}
          size="sm"
          className={buttonStyle}
          onClick={() => setDialogOpen(true)}
          aria-label={locale === "en" ? "Share profile as image" : "Bagikan profil sebagai gambar"}
        >
          <FileText className="h-3 w-3 mr-1" />
          {locale === "en" ? "Share" : "Bagikan"}
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
        locale={locale}
      />
    </>
  )
}
