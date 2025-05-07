"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { generateTemplateImage, shareTemplateImage } from "@/lib/template-image-generator"
import { Download, Share } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
        title: "Gagal membuat preview",
        description: "Terjadi kesalahan saat membuat preview gambar",
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
      await shareTemplateImage(
        imagePreview,
        `Pesan untuk @${username}`,
        `Pesan anonim untuk @${username} dari SecretMe`,
      )
      onOpenChange(false)
    } catch (error) {
      console.error("Error sharing image:", error)
      toast({
        title: "Gagal membagikan gambar",
        description: "Terjadi kesalahan saat membagikan gambar",
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bagikan Sebagai Gambar</DialogTitle>
          <DialogDescription>Lihat preview dan bagikan pesan sebagai gambar</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Image preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="border rounded-lg p-2 bg-gray-50 flex justify-center">
              {isGenerating ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="h-8 w-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                </div>
              ) : imagePreview ? (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full max-h-[400px] object-contain rounded shadow-sm"
                />
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">Preview tidak tersedia</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={!imagePreview || isGenerating}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Unduh Gambar
          </Button>
          <Button
            type="button"
            onClick={handleShare}
            disabled={!imagePreview || isGenerating || isSharing}
            className="w-full sm:w-auto"
          >
            {isSharing ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                Membagikan...
              </>
            ) : (
              <>
                <Share className="mr-2 h-4 w-4" />
                Bagikan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
