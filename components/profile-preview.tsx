"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Instagram, Facebook, Linkedin, ExternalLink } from "lucide-react"
import Image from "next/image"

interface ProfilePreviewProps {
  user: {
    id: string
    name: string
    username: string | null
    numeric_id: number
    is_premium: boolean
    avatar_url: string | null
    bio: string | null
    instagram_url: string | null
    facebook_url: string | null
    linkedin_url: string | null
    tiktok_url: string | null
  }
}

export function ProfilePreview({ user }: ProfilePreviewProps) {
  // Menghitung apakah pengguna memiliki link sosial media
  const hasSocialLinks = user.instagram_url || user.facebook_url || user.linkedin_url || user.tiktok_url

  // Mendapatkan URL profil publik
  const profileUrl = `${window.location.origin}/${user.is_premium && user.username ? user.username : user.numeric_id}`

  // Fungsi untuk membuka profil di tab baru
  const openProfile = () => {
    window.open(profileUrl, "_blank")
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Pratinjau Profil Publik</h3>
        <Badge variant="outline" className="text-xs">
          Tampilan Pengunjung
        </Badge>
      </div>

      <Card className="neo-card overflow-hidden border-2 border-[var(--border)] shadow-[var(--shadow)]">
        <CardContent className="p-0 bg-[var(--bg)]">
          {/* Header dengan background gradient */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 pb-16 relative border-b border-[var(--border)]">
            {/* Badge premium dihapus dari sini */}
          </div>

          {/* Profile Info */}
          <div className="px-4 -mt-12 mb-4">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-3">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-black bg-white shadow-[var(--shadow)]">
                  {user.is_premium && user.avatar_url ? (
                    <Image
                      src={user.avatar_url || "/placeholder.svg"}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-600 text-4xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Username */}
              <h2 className="text-xl font-bold mb-1">{user.name}</h2>
              <p className="text-sm text-muted-foreground">@{user.username || user.numeric_id}</p>

              {/* Bio */}
              {user.is_premium && user.bio && <p className="text-sm mt-3 max-w-md">{user.bio}</p>}

              {/* Social Media Links */}
              {user.is_premium && hasSocialLinks && (
                <div className="flex gap-2 mt-4">
                  {user.instagram_url && (
                    <a
                      href={user.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white border-2 border-[var(--border)] transition-all"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {user.facebook_url && (
                    <a
                      href={user.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-[var(--border)] transition-all"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {user.linkedin_url && (
                    <a
                      href={user.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-700 text-white border-2 border-[var(--border)] transition-all"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {user.tiktok_url && (
                    <a
                      href={user.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white border-2 border-[var(--border)] transition-all"
                    >
                      <span className="font-bold text-sm">T</span>
                    </a>
                  )}
                </div>
              )}

              {/* Tombol Buka Profil */}
              <Button
                onClick={openProfile}
                className="mt-4 neo-btn flex items-center gap-2"
                variant="default"
                size="sm"
              >
                <ExternalLink className="h-4 w-4" />
                Buka Link Profil Saya
              </Button>
            </div>
          </div>

          {/* Message Form Preview */}
          <div className="border-t border-gray-200 p-4">
            <div className="bg-white p-4 rounded-lg border-2 border-[var(--border)] shadow-[var(--shadow)]">
              <h3 className="text-base font-semibold mb-3">Kirim Pesan Anonim</h3>
              <div className="h-24 bg-gray-100 rounded-md border-2 border-gray-200 mb-3"></div>
              <Button disabled className="w-full neo-btn opacity-70">
                <MessageSquare className="h-4 w-4 mr-2" />
                Kirim Pesan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 text-xs text-center text-muted-foreground">
        Ini adalah pratinjau bagaimana profil Anda terlihat bagi pengunjung.
      </div>
    </div>
  )
}
