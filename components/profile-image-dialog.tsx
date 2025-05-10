"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { generateProfileImage, shareTemplateImage } from "@/lib/template-image-generator"
import { useToast } from "@/hooks/use-toast"

interface ProfileImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  displayName?: string
  bio?: string
  avatarUrl?: string | null
  isPremium?: boolean
}

export function ProfileImageDialog({
  open,
  onOpenChange,
  username,
  displayName,
  bio,
  avatarUrl,
  isPremium,
}: ProfileImageDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Teks untuk berbagi
  const shareTitle = `Profil @${username} di SecretMe`
  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${username}` : `https://secretme.app/${username}`

  // Change this:
  // const shareText = `Kirim pesan anonim ke @${username} di SecretMe`

  // To this:
  const shareText = `Kirimi saya pesan anonim di ${profileUrl}`

  // Generate profile URL

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
        isPremium: isPremium || false,
        profileUrl,
      })
      setImageUrl(dataUrl)
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Gagal membuat preview",
        description: "Terjadi kesalahan saat membuat preview gambar",
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
      title: "Berhasil",
      description: "Gambar profil berhasil diunduh",
    })
  }

  const handleShare = async () => {
    if (!imageUrl) return

    try {
      await shareTemplateImage(imageUrl, shareTitle, shareText)
      toast({
        title: "Berhasil",
        description: "Gambar profil berhasil dibagikan",
      })
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Gagal membagikan",
        description: "Terjadi kesalahan saat membagikan gambar",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bagikan Profil Sebagai Gambar</DialogTitle>
          <DialogDescription>Buat dan bagikan gambar profil Anda dengan mudah</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                <p className="text-gray-500">Membuat gambar...</p>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="relative w-full overflow-hidden border rounded-lg p-2 bg-gray-50 border-black">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={`Profil ${displayName || username}`}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Tidak dapat membuat gambar</p>
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
              Unduh
            </Button>
            <Button onClick={handleShare} disabled={isLoading || !imageUrl} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Bagikan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
