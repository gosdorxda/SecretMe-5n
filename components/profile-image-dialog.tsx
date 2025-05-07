"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"
import Image from "next/image"
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      generateProfileImage()
    }
  }, [open])

  const generateProfileImage = async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 720
    canvas.height = 400

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#f5f5f5")
    gradient.addColorStop(1, "#e0e0e0")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw header
    const headerGradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
    headerGradient.addColorStop(0, "#3b82f6")
    headerGradient.addColorStop(1, "#8b5cf6")
    ctx.fillStyle = headerGradient
    ctx.fillRect(0, 0, canvas.width, 80)

    // Draw SecretMe logo/text
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 24px Inter, sans-serif"
    ctx.fillText("SecretMe", 20, 50)

    // Load and draw avatar
    try {
      const avatarSize = 120
      const avatarX = canvas.width / 2 - avatarSize / 2
      const avatarY = 100

      if (avatarUrl) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = avatarUrl

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        // Draw avatar background
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2)
        ctx.fill()

        // Draw avatar
        ctx.save()
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
        ctx.restore()
      } else {
        // Draw placeholder avatar
        ctx.fillStyle = "#e5e7eb"
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
        ctx.fill()

        // Draw user icon
        ctx.fillStyle = "#9ca3af"
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2 - 15, 25, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(avatarX + avatarSize / 2 - 30, avatarY + avatarSize / 2 + 20, 60, 30)
      }

      // Draw premium badge if applicable
      if (isPremium) {
        ctx.fillStyle = "#fbbf24"
        ctx.beginPath()
        ctx.arc(avatarX + avatarSize - 10, avatarY + 10, 15, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#000000"
        ctx.font = "bold 12px Inter, sans-serif"
        ctx.fillText("★", avatarX + avatarSize - 15, avatarY + 15)
      }

      // Draw name
      ctx.fillStyle = "#000000"
      ctx.font = "bold 28px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(displayName || username, canvas.width / 2, avatarY + avatarSize + 40)

      // Draw username
      ctx.fillStyle = "#4b5563"
      ctx.font = "16px Inter, sans-serif"
      ctx.fillText(`@${username}`, canvas.width / 2, avatarY + avatarSize + 70)

      // Draw bio if available
      if (bio) {
        ctx.fillStyle = "#4b5563"
        ctx.font = "14px Inter, sans-serif"

        // Wrap text
        const maxWidth = 500
        const words = bio.split(" ")
        let line = ""
        let y = avatarY + avatarSize + 100

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " "
          const metrics = ctx.measureText(testLine)

          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, canvas.width / 2, y)
            line = words[i] + " "
            y += 20
          } else {
            line = testLine
          }
        }

        ctx.fillText(line, canvas.width / 2, y)
      }

      // Draw CTA button
      const buttonY = bio ? avatarY + avatarSize + 150 : avatarY + avatarSize + 100

      // Button background
      ctx.fillStyle = "#3b82f6"
      ctx.beginPath()
      ctx.roundRect(canvas.width / 2 - 150, buttonY, 300, 50, 8)
      ctx.fill()

      // Button text
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 16px Inter, sans-serif"
      ctx.fillText("Kirim Pesan Anonim", canvas.width / 2, buttonY + 30)

      // Draw URL at bottom
      ctx.fillStyle = "#6b7280"
      ctx.font = "14px Inter, sans-serif"
      ctx.fillText(`secretme.site/${username}`, canvas.width / 2, canvas.height - 20)

      // Convert canvas to image URL
      const dataUrl = canvas.toDataURL("image/png")
      setImageUrl(dataUrl)
      setIsLoading(false)
    } catch (error) {
      console.error("Error generating image:", error)
      toast({
        title: "Error",
        description: "Gagal membuat gambar profil",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `${username}-profile.png`
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
      // Convert data URL to blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: `Profil ${displayName || username} di SecretMe`,
          text: `Lihat profil ${displayName || username} di SecretMe`,
          files: [new File([blob], `${username}-profile.png`, { type: "image/png" })],
        })
      } else {
        // Fallback if Web Share API is not available
        toast({
          title: "Info",
          description: "Fitur berbagi tidak didukung di browser ini. Silakan unduh gambar terlebih dahulu.",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Error",
        description: "Gagal membagikan gambar profil",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bagikan Profil Sebagai Gambar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {/* Hidden canvas for image generation */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {isLoading ? (
            <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
              <p className="text-gray-500">Membuat gambar...</p>
            </div>
          ) : imageUrl ? (
            <div className="relative w-full overflow-hidden rounded-md">
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={`Profil ${displayName || username}`}
                width={720}
                height={400}
                className="w-full h-auto"
              />
            </div>
          ) : null}

          <div className="flex space-x-2 w-full justify-center">
            <Button onClick={handleDownload} disabled={isLoading || !imageUrl} className="flex items-center gap-2">
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
