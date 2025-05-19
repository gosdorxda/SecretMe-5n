"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { generateProfileImage, shareTemplateImage } from "@/lib/template-image-generator"
import { useToast } from "@/hooks/use-toast"
import { LoadingAnimation } from "@/components/loading-animation"

interface ProfileImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  displayName: string
  bio?: string | null
  avatarUrl?: string | null
  isPremium?: boolean
  locale?: string
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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Teks untuk berbagi
  const shareTitle = locale === "en" ? `@${username}'s Profile on SecretMe` : `Profil @${username} di SecretMe`

  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${username}` : `https://secretme.app/${username}`

  const shareText =
    locale === "en" ? `Send me an anonymous message at ${profileUrl}` : `Kirimi saya pesan anonim di ${profileUrl}`

  // Generate preview when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      generatePreview()
    }
  }, [open])

  const generatePreview = async () => {
    if (!open) return

    try {
      const dataUrl = await generateProfileImage({
        username,
        displayName: displayName || "",
        bio: bio || "",
        avatarUrl,
        profileUrl,
      })
      setImageUrl(dataUrl)
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: locale === "en" ? "Failed to create preview" : "Gagal membuat preview",
        description:
          locale === "en"
            ? "An error occurred while creating the image preview"
            : "Terjadi kesalahan saat membuat preview gambar",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `profil-${username.replace(/\s+/g, "-")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: locale === "en" ? "Success" : "Berhasil",
      description: locale === "en" ? "Profile image successfully downloaded" : "Gambar profil berhasil diunduh",
    })
  }

  const handleShare = async () => {
    if (!imageUrl) return

    try {
      await shareTemplateImage(imageUrl, shareTitle, shareText)
      toast({
        title: locale === "en" ? "Success" : "Berhasil",
        description: locale === "en" ? "Profile image successfully shared" : "Gambar profil berhasil dibagikan",
      })
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: locale === "en" ? "Failed to share" : "Gagal membagikan",
        description:
          locale === "en" ? "An error occurred while sharing the image" : "Terjadi kesalahan saat membagikan gambar",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{locale === "en" ? "Share Your Profile" : "Bagikan Profil Anda"}</DialogTitle>
          <DialogDescription>
            {locale === "en"
              ? "Share your profile as an image with friends"
              : "Bagikan profil Anda sebagai gambar dengan teman"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
              <LoadingAnimation
                variant="pulse"
                message={locale === "en" ? "Creating your profile image..." : "Membuat gambar profil Anda..."}
              />
            </div>
          ) : imageUrl ? (
            <div className="relative w-full overflow-hidden border rounded-lg p-2 bg-gray-50 border-black">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={locale === "en" ? `${username}'s Profile` : `Profil ${username}`}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">{locale === "en" ? "Failed to create image" : "Gagal membuat gambar"}</p>
            </div>
          )}

          <div className="flex space-x-2 w-full justify-center">
            <Button
              onClick={handleDownload}
              disabled={isLoading || !imageUrl}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {locale === "en" ? "Download" : "Unduh"}
            </Button>
            <Button onClick={handleShare} disabled={isLoading || !imageUrl} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              {locale === "en" ? "Share" : "Bagikan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
