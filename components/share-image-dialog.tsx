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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { generateTemplateImage, shareTemplateImage, type TemplateTheme } from "@/lib/template-image-generator"
import { Check, Download, Share } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  message: string
  date: string
  avatarUrl?: string | null
}

export function ShareImageDialog({ open, onOpenChange, username, message, date, avatarUrl }: ShareImageDialogProps) {
  const [theme, setTheme] = useState<TemplateTheme>("light")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  // Generate preview when dialog opens or theme changes
  useEffect(() => {
    if (open) {
      generatePreview()
    }
  }, [open, theme])

  const generatePreview = async () => {
    if (!open) return

    setIsGenerating(true)
    try {
      const dataUrl = await generateTemplateImage({
        username,
        message,
        date,
        avatarUrl,
        theme,
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
          <DialogDescription>Pilih tema dan bagikan pesan sebagai gambar</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Theme selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pilih Tema</h3>
            <RadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as TemplateTheme)}
              className="grid grid-cols-3 gap-4"
            >
              <div className="relative">
                <RadioGroupItem value="light" id="light" className="sr-only" />
                <Label
                  htmlFor="light"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                    theme === "light" ? "border-primary" : "border-muted"
                  }`}
                >
                  <div className="w-full h-16 mb-2 rounded-md bg-white border border-gray-200 flex flex-col">
                    <div className="h-4 bg-orange-400 w-full"></div>
                    <div className="flex-1 p-2">
                      <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <span>Terang</span>
                  {theme === "light" && (
                    <div className="absolute top-2 right-2 h-5 w-5 text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </Label>
              </div>

              <div className="relative">
                <RadioGroupItem value="dark" id="dark" className="sr-only" />
                <Label
                  htmlFor="dark"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                    theme === "dark" ? "border-primary" : "border-muted"
                  }`}
                >
                  <div className="w-full h-16 mb-2 rounded-md bg-gray-900 border border-gray-700 flex flex-col">
                    <div className="h-4 bg-gray-800 w-full"></div>
                    <div className="flex-1 p-2">
                      <div className="w-3/4 h-2 bg-gray-700 rounded mb-1"></div>
                      <div className="w-1/2 h-2 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <span>Gelap</span>
                  {theme === "dark" && (
                    <div className="absolute top-2 right-2 h-5 w-5 text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </Label>
              </div>

              <div className="relative">
                <RadioGroupItem value="colorful" id="colorful" className="sr-only" />
                <Label
                  htmlFor="colorful"
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                    theme === "colorful" ? "border-primary" : "border-muted"
                  }`}
                >
                  <div className="w-full h-16 mb-2 rounded-md bg-blue-50 border border-blue-200 flex flex-col">
                    <div className="h-4 bg-blue-500 w-full"></div>
                    <div className="flex-1 p-2">
                      <div className="w-3/4 h-2 bg-blue-200 rounded mb-1"></div>
                      <div className="w-1/2 h-2 bg-blue-200 rounded"></div>
                    </div>
                  </div>
                  <span>Berwarna</span>
                  {theme === "colorful" && (
                    <div className="absolute top-2 right-2 h-5 w-5 text-primary">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Image preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="border rounded-lg p-2 bg-gray-50 flex justify-center">
              {isGenerating ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="h-8 w-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                </div>
              ) : imagePreview ? (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-full max-h-[300px] object-contain rounded shadow-sm"
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400">Preview tidak tersedia</div>
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
