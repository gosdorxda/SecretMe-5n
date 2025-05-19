"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShareableCard } from "@/components/shareable-card"
import { DomToImageButton } from "@/components/dom-to-image-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Download, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  // useEffect(() => {
  //   if (open) {
  //     setIsLoading(true)
  //     generatePreview()
  //   }
  // }, [open])

  // const generatePreview = async () => {
  //   if (!open) return

  //   try {
  //     const dataUrl = await generateProfileImage({
  //       username,
  //       displayName: displayName || "",
  //       bio: bio || "",
  //       avatarUrl,
  //       isPremium: isPremium || false,
  //       profileUrl,
  //     })
  //     setImageUrl(dataUrl)
  //   } catch (error) {
  //     console.error("Error generating preview:", error)
  //     toast({
  //       title: "Gagal membuat preview",
  //       description: "Terjadi kesalahan saat membuat preview gambar",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // const handleDownload = () => {
  //   if (!imageUrl) return

  //   const link = document.createElement("a")
  //   link.href = imageUrl
  //   link.download = `profil-${username.replace(/\s+/g, "-")}.png`
  //   document.body.appendChild(link)
  //   link.click()
  //   document.body.removeChild(link)

  //   toast({
  //     title: "Berhasil",
  //     description: "Gambar profil berhasil diunduh",
  //   })
  // }

  // const handleShare = async () => {
  //   if (!imageUrl) return

  //   try {
  //     await shareTemplateImage(imageUrl, shareTitle, shareText)
  //     toast({
  //       title: "Berhasil",
  //       description: "Gambar profil berhasil dibagikan",
  //     })
  //   } catch (error) {
  //     console.error("Error sharing:", error)
  //     toast({
  //       title: "Gagal membagikan",
  //       description: "Terjadi kesalahan saat membagikan gambar",
  //       variant: "destructive",
  //     })
  //   }
  // }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{locale === "en" ? "Share Your Profile" : "Bagikan Profil Anda"}</DialogTitle>
          <DialogDescription>
            {locale === "en"
              ? "Share your profile as an image or QR code"
              : "Bagikan profil Anda sebagai gambar atau kode QR"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">{locale === "en" ? "Profile Card" : "Kartu Profil"}</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="flex flex-col items-center">
            <div ref={cardRef} className="my-4 w-full max-w-xs mx-auto">
              <ShareableCard
                username={username}
                displayName={displayName}
                bio={bio || ""}
                avatarUrl={avatarUrl}
                isPremium={isPremium}
                locale={locale}
              />
            </div>
            <div className="flex gap-2 w-full justify-center mt-2">
              <DomToImageButton
                elementRef={cardRef}
                filename={`secretme-${username}.png`}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                {locale === "en" ? "Download" : "Unduh"}
              </DomToImageButton>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={async () => {
                  if (cardRef.current && "toBlob" in cardRef.current) {
                    try {
                      // @ts-ignore - DOMtoImage adds this method
                      const blob = await cardRef.current.toBlob()
                      const file = new File([blob], `secretme-${username}.png`, { type: "image/png" })
                      if (navigator.share) {
                        await navigator.share({
                          title: `SecretMe - ${displayName || username}`,
                          files: [file],
                        })
                      } else {
                        // Fallback for browsers that don't support Web Share API
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `secretme-${username}.png`
                        a.click()
                        URL.revokeObjectURL(url)
                      }
                    } catch (error) {
                      console.error("Error sharing:", error)
                    }
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {locale === "en" ? "Share" : "Bagikan"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="qr" className="flex flex-col items-center">
            <div ref={qrRef} className="bg-white p-4 rounded-lg my-4">
              <div className="text-center mb-2 font-medium">
                {locale === "en" ? "Scan to visit" : "Pindai untuk mengunjungi"}
              </div>
              <div className="relative">
                {qrUrl ? (
                  <img src={qrUrl || "/placeholder.svg"} alt="QR Code" className="w-48 h-48 mx-auto" />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 animate-pulse flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-center mt-2 text-sm text-gray-500">@{username}</div>
            </div>
            <div className="flex gap-2 w-full justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (qrUrl) {
                    const a = document.createElement("a")
                    a.href = qrUrl
                    a.download = `secretme-qr-${username}.png`
                    a.click()
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {locale === "en" ? "Download QR" : "Unduh QR"}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={async () => {
                  if (qrUrl) {
                    try {
                      const response = await fetch(qrUrl)
                      const blob = await response.blob()
                      const file = new File([blob], `secretme-qr-${username}.png`, { type: "image/png" })
                      if (navigator.share) {
                        await navigator.share({
                          title: `SecretMe QR - ${displayName || username}`,
                          files: [file],
                        })
                      } else {
                        // Fallback for browsers that don't support Web Share API
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `secretme-qr-${username}.png`
                        a.click()
                        URL.revokeObjectURL(url)
                      }
                    } catch (error) {
                      console.error("Error sharing:", error)
                    }
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {locale === "en" ? "Share QR" : "Bagikan QR"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
