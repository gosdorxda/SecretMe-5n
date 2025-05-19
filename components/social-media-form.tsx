"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Instagram, Facebook, Linkedin, InstagramIcon as BrandTiktok } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

interface SocialMediaFormProps {
  userId: string
  instagramUrl: string | null
  facebookUrl: string | null
  linkedinUrl: string | null
  tiktokUrl: string | null
}

export function SocialMediaForm({ userId, instagramUrl, facebookUrl, linkedinUrl, tiktokUrl }: SocialMediaFormProps) {
  const [urls, setUrls] = useState({
    instagram: instagramUrl || "",
    facebook: facebookUrl || "",
    linkedin: linkedinUrl || "",
    tiktok: tiktokUrl || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const { locale } = useLanguage()

  function handleChange(platform: keyof typeof urls, value: string) {
    setUrls((prev) => ({ ...prev, [platform]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          instagram_url: urls.instagram || null,
          facebook_url: urls.facebook || null,
          linkedin_url: urls.linkedin || null,
          tiktok_url: urls.tiktok || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) {
        throw error
      }

      toast({
        title: locale === "en" ? "Social media links saved" : "Link sosial media berhasil disimpan",
        description:
          locale === "en"
            ? "Your profile has been updated with social media links"
            : "Profil Anda telah diperbarui dengan link sosial media",
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: locale === "en" ? "Failed to save social media links" : "Gagal menyimpan link sosial media",
        description:
          error.message ||
          (locale === "en"
            ? "An error occurred while saving social media links"
            : "Terjadi kesalahan saat menyimpan link sosial media"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4 w-full">
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500 flex-shrink-0" />
          <div className="w-full">
            <Label htmlFor="instagram" className="sr-only">
              Instagram
            </Label>
            <Input
              id="instagram"
              placeholder="https://instagram.com/username"
              value={urls.instagram}
              onChange={(e) => handleChange("instagram", e.target.value)}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <div className="w-full">
            <Label htmlFor="facebook" className="sr-only">
              Facebook
            </Label>
            <Input
              id="facebook"
              placeholder="https://facebook.com/username"
              value={urls.facebook}
              onChange={(e) => handleChange("facebook", e.target.value)}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 flex-shrink-0" />
          <div className="w-full">
            <Label htmlFor="linkedin" className="sr-only">
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/in/username"
              value={urls.linkedin}
              onChange={(e) => handleChange("linkedin", e.target.value)}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <BrandTiktok className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <div className="w-full">
            <Label htmlFor="tiktok" className="sr-only">
              TikTok
            </Label>
            <Input
              id="tiktok"
              placeholder="https://tiktok.com/@username"
              value={urls.tiktok}
              onChange={(e) => handleChange("tiktok", e.target.value)}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full h-8 sm:h-10 text-xs sm:text-sm" disabled={isLoading}>
        {isLoading
          ? locale === "en"
            ? "Saving..."
            : "Menyimpan..."
          : locale === "en"
            ? "Save Social Media Links"
            : "Simpan Link Sosial Media"}
      </Button>
    </form>
  )
}
