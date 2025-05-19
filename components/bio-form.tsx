"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"

interface BioFormProps {
  userId: string
  currentBio: string | null
}

export function BioForm({ userId, currentBio }: BioFormProps) {
  const [bio, setBio] = useState(currentBio || "")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  const { locale } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setIsLoading(true)

    try {
      // Update bio
      const { error } = await supabase
        .from("users")
        .update({ bio, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) {
        throw error
      }

      toast({
        title: locale === "en" ? "Bio updated" : "Bio berhasil diperbarui",
        description:
          locale === "en" ? "Your profile description has been updated" : "Deskripsi profil Anda telah diperbarui",
      })

      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: locale === "en" ? "Failed to update bio" : "Gagal memperbarui bio",
        description:
          error.message ||
          (locale === "en"
            ? "An error occurred while updating profile description"
            : "Terjadi kesalahan saat memperbarui deskripsi profil"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1 sm:space-y-2 w-full">
        <Label htmlFor="bio" className="text-xs sm:text-sm">
          {locale === "en" ? "Bio / Short Description" : "Bio / Deskripsi Singkat"}
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={locale === "en" ? "Tell a bit about yourself..." : "Ceritakan sedikit tentang diri Anda..."}
          rows={3}
          maxLength={300}
          className="resize-none w-full text-xs sm:text-sm"
        />
        <p className="text-[10px] xs:text-xs text-muted-foreground text-right">
          {bio.length}/300 {locale === "en" ? "characters" : "karakter"}
        </p>
      </div>
      <Button
        type="submit"
        disabled={isLoading || bio === currentBio}
        className="w-full h-8 sm:h-10 text-xs sm:text-sm"
      >
        {isLoading ? (locale === "en" ? "Saving..." : "Menyimpan...") : locale === "en" ? "Save Bio" : "Simpan Bio"}
      </Button>
    </form>
  )
}
