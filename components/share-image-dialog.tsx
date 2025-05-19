"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import { generateTemplateImage, shareTemplateImage } from "@/lib/template-image-generator"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

interface ShareImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  message: string
  date: string
  avatarUrl?: string | null
  displayName?: string | null
}

export function ShareImageDialog({
  open,
  onOpenChange,
  username,
  message,
  date,
  avatarUrl,
  displayName,
}: ShareImageDialogProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

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
      const dataUrl = await generateTemplateImage({
        username,
        message,
        date,
        avatarUrl,
        displayName: displayName || "",
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
      await shareTemplateImage(imagePreview, t.shareImage.shareText, t.shareImage.shareText)
      toast({
        title: t.common.success,
        description: t.shareImage.successShare,
      })
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: t.shareImage.errorTitle,
        description: t.shareImage.errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = () => {
    if (!imagePreview) return

    const link = document.createElement("a")
    link.href = imagePreview
    link.download = `pesan-untuk-${username.replace(/\s+/g, "-")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: t.common.success,
      description: t.shareImage.successDownload,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.shareImage.title}</DialogTitle>
          <DialogDescription>{t.shareImage.description}</DialogDescription>
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
              <img src={imagePreview || "/placeholder.svg"} alt={`Pesan untuk ${username}`} className="w-full h-auto" />
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
