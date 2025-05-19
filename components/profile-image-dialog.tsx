"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ShareImageDialog } from "@/components/share-image-dialog"
import { useLanguage } from "@/lib/i18n/language-context"

interface ProfileImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  isPremium?: boolean
  locale?: string // Add locale prop
}

export function ProfileImageDialog({
  open,
  onOpenChange,
  username,
  displayName,
  bio,
  avatarUrl,
  isPremium,
  locale = "id",
}: ProfileImageDialogProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [qrUrl, setQrUrl] = useState("")
  const cardRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const { locale: currentLocale } = useLanguage()

  // Teks untuk berbagi
  const shareTitle = `Profil @${username} di SecretMe`
  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${username}` : `https://secretme.app/${username}`

  // Change this:
  // const shareText = `Kirim pesan anonim ke @${username} di SecretMe`

  // To this:
  const shareText = `Kirimi saya pesan anonim di ${profileUrl}`

  // Generate QR code URL
  useEffect(() => {
    if (open) {
      const baseUrl = window.location.origin
      const profileUrl = `${baseUrl}/${username}`
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        profileUrl,
      )}`
      setQrUrl(qrCodeUrl)
    }
  }, [open, username])

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="flex items-center gap-1.5">
        <Share2 className="h-4 w-4" />
        <span>{t.common.shareProfile}</span>
      </Button>

      <ShareImageDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        username={username}
        displayName={displayName}
        avatarUrl={avatarUrl}
        bio={bio}
        profileUrl={profileUrl}
        isProfileShare={true}
      />
    </>
  )
}
