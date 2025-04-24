"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, LinkIcon } from "lucide-react"

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
}

export function AvatarUpload({ userId, avatarUrl }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState("")
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (avatarUrl) {
      setAvatar(avatarUrl)
      setExternalUrl(avatarUrl)
    }
  }, [avatarUrl])

  async function saveExternalUrl(e: React.FormEvent) {
    e.preventDefault()

    if (!externalUrl.trim()) {
      toast({
        title: "URL tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    // Validasi URL sederhana
    try {
      new URL(externalUrl)
    } catch (error) {
      toast({
        title: "URL tidak valid",
        description: "Masukkan URL gambar yang valid (contoh: https://example.com/image.jpg)",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // Update user dengan avatar_url baru
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: externalUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      setAvatar(externalUrl)

      toast({
        title: "Avatar berhasil diperbarui",
        description: "Foto profil Anda telah diperbarui dengan URL gambar eksternal",
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Gagal memperbarui avatar",
        description: error.message || "Terjadi kesalahan saat memperbarui avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="mb-1 sm:mb-2">
        <h4 className="text-xs sm:text-sm font-medium text-amber-700 mb-0.5 sm:mb-1">URL Gambar Eksternal</h4>
        <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">
          Masukkan URL gambar dari internet (JPG, PNG, GIF)
        </p>
      </div>

      <form onSubmit={saveExternalUrl} className="flex flex-col gap-2">
        <Input
          id="avatar-url"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          disabled={uploading}
          className="h-8 sm:h-9 text-xs sm:text-sm"
        />
        <Button
          type="submit"
          disabled={uploading || externalUrl === avatarUrl}
          className="w-full mt-1 sm:mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-black hover:from-amber-600 hover:to-orange-600 text-xs sm:text-sm py-1.5 sm:py-2"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span>Perbarui Foto Profil</span>
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
