"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Copy, Share2, Instagram, Facebook, Linkedin, InstagramIcon as BrandTiktok, User } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

interface ShareProfileProps {
  userId: string
  numericId: number
  username: string | null
  isPremium: boolean
  instagramUrl?: string | null
  facebookUrl?: string | null
  linkedinUrl?: string | null
  tiktokUrl?: string | null
  avatarUrl?: string | null
  bio?: string | null
}

export function ShareProfile({
  userId,
  numericId,
  username,
  isPremium,
  instagramUrl,
  facebookUrl,
  linkedinUrl,
  tiktokUrl,
  avatarUrl,
  bio,
}: ShareProfileProps) {
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  const profileUrl = `${appUrl}/${isPremium && username ? username : numericId}`

  function copyToClipboard() {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareProfile() {
    if (navigator.share) {
      navigator.share({
        title: "Kirim pesan anonim ke saya",
        text: "Kirim pesan anonim ke saya melalui SecretMe",
        url: profileUrl,
      })
    } else {
      copyToClipboard()
    }
  }

  const hasSocialLinks = isPremium && (instagramUrl || facebookUrl || linkedinUrl || tiktokUrl)

  return (
    <Card>
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
          {isPremium && avatarUrl ? (
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-full border flex-shrink-0">
              <Image
                src={avatarUrl || "/placeholder.svg"}
                alt="Avatar"
                className="h-full w-full object-cover"
                width={64}
                height={64}
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border bg-muted flex-shrink-0">
              <User className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-medium mb-1 text-sm sm:text-base">Bagikan Profil Anda</h3>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-blue-700 font-medium">@{username || numericId}</span>
            </div>
            {isPremium && bio ? (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{bio}</p>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Bagikan link ini untuk menerima pesan anonim
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Input value={profileUrl} readOnly className="text-xs sm:text-sm" />
          <Button variant="outline" size="icon" onClick={copyToClipboard} title="Salin link" className="flex-shrink-0">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="default" size="icon" onClick={shareProfile} title="Bagikan" className="flex-shrink-0">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        {copied && <p className="text-xs text-green-600 mt-2">Link berhasil disalin!</p>}

        {hasSocialLinks && (
          <div className="mt-4 flex flex-col xs:flex-row xs:items-center gap-2">
            <span className="text-xs text-muted-foreground">Sosial media:</span>
            <div className="flex gap-2">
              {instagramUrl && (
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-pink-100" asChild title="Instagram">
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4 text-pink-500" />
                  </a>
                </Button>
              )}
              {facebookUrl && (
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-blue-100" asChild title="Facebook">
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-4 w-4 text-blue-600" />
                  </a>
                </Button>
              )}
              {linkedinUrl && (
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-blue-100" asChild title="LinkedIn">
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                  </a>
                </Button>
              )}
              {tiktokUrl && (
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-gray-100" asChild title="TikTok">
                  <a href={tiktokUrl} target="_blank" rel="noopener noreferrer">
                    <BrandTiktok className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {!isPremium && (
          <div className="mt-4 p-3 bg-muted rounded-md border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">Upgrade ke premium</span> untuk mendapatkan foto profil, bio,
              link profil kustom dengan username pilihan Anda.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
