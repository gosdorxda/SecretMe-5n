"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { generateProfileImage, shareTemplateImage } from "@/lib/template-image-generator"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

interface ShareImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  message?: string
  date?: string
  avatarUrl?: string | null
  displayName?: string | null
  bio?: string
  profileUrl?: string
  isProfileShare?: boolean
}

export function ShareImageDialog({
  open,
  onOpenChange,
  username,
  message,
  date,
  avatarUrl,
  displayName,
  bio,
  profileUrl,
  isProfileShare = true,
}: ShareImageDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()
  const { t, locale } = useLanguage()

  // Generate preview when dialog opens
  useEffect(() => {
    if (open) {
      generatePreview()
    }
  }, [open])

  const generatePreview = async () => {
    if (!open) return

    setIsGenerating(true)
    try {
      // Generate profile image instead of message template
      const dataUrl = await generateProfileImage({
        username,
        displayName: displayName || "",
        bio: bio || "",
        avatarUrl,
        profileUrl: profileUrl || `${window.location.origin}/${locale === "en" ? "en/" : ""}${username}`,
      })
      setImagePreview(dataUrl)
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: t.common.error,
        description: t.shareImage.errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!imagePreview || isSharing) return

    setIsSharing(true)
    try {
      // Use Web Share API directly if available
      if (navigator.share) {
        // Convert data URL to blob
        const response = await fetch(imagePreview)
        const blob = await response.blob()
        const file = new File([blob], `profile-${username.replace(/\s+/g, "-")}.png`, { type: "image/png" })

        await navigator.share({
          title: t.shareImage.profileShareTitle,
          text: t.shareImage.profileShareText,
          files: [file],
        })
      } else {
        // Fallback to custom share function
        await shareTemplateImage(imagePreview, t.shareImage.profileShareTitle, t.shareImage.profileShareText)
      }

      toast({
        title: t.common.success,
        description: t.shareImage.successShare,
      })
    } catch (error) {
      console.error("Error sharing:", error)
      // Don't show error for AbortError (user cancelled sharing)
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: t.shareImage.errorTitle,
          description: t.shareImage.errorDescription,
          variant: "destructive",
        })
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = () => {
    if (!imagePreview) return

    try {
      // Create a temporary link element
      const link = document.createElement("a")
      link.href = imagePreview
      link.download = `profile-${username.replace(/\s+/g, "-")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t.common.success,
        description: t.shareImage.successDownload,
      })
    } catch (error) {
      console.error("Error downloading:", error)
      toast({
        title: t.common.error,
        description: t.shareImage.errorDownload,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.shareImage.profileTitle}</DialogTitle>
          <DialogDescription>{t.shareImage.profileDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {isGenerating ? (
            <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                <p className="text-gray-500">{t.common.creatingImage}</p>
              </div>
            </div>
          ) : imagePreview ? (
            <div className="relative w-full overflow-hidden border rounded-lg p-2 bg-gray-50 border-black">
              <img src={imagePreview || "/placeholder.svg"} alt={`Profil ${username}`} className="w-full h-auto" />
            </div>
          ) : (
            <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">{t.common.failedToCreate}</p>
            </div>
          )}

          <div className="flex space-x-2 w-full justify-center">
            <Button
              onClick={handleDownload}
              disabled={isGenerating || !imagePreview}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {t.common.download}
            </Button>
            <Button onClick={handleShare} disabled={isGenerating || !imagePreview} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              {t.common.share}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
