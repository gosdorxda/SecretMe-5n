"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, LinkIcon, Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface AvatarUploadProps {
  userId: string
  avatarUrl: string | null
}

export function AvatarUpload({ userId, avatarUrl }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState("")
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (avatarUrl) {
      setAvatar(avatarUrl)
      setExternalUrl(avatarUrl)
    }
  }, [avatarUrl])

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      // Ambil file dari input file
      const files = event.target.files
      if (!files || files.length === 0) {
        throw new Error("Pilih file gambar terlebih dahulu")
      }

      const file = files[0]

      // Validasi tipe file
      if (!file.type.includes("image")) {
        throw new Error("File harus berupa gambar (JPG, PNG, GIF)")
      }

      // Validasi ukuran file (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Ukuran file maksimal 2MB")
      }

      // Hapus avatar lama jika ada dan berasal dari storage Supabase
      if (avatar && avatar.includes("supabase.co/storage")) {
        try {
          // Ekstrak path file dari URL
          const urlParts = avatar.split("/")
          const fileName = urlParts[urlParts.length - 1].split("?")[0]

          // Hapus file lama dari storage
          await supabase.storage.from("avatars").remove([fileName])
        } catch (error) {
          console.error("Error menghapus avatar lama:", error)
          // Lanjutkan proses meskipun gagal menghapus avatar lama
        }
      }

      // Buat nama file unik berdasarkan userId
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload file ke Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Dapatkan URL publik gambar
      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)
      const publicUrl = data.publicUrl

      // Update user dengan avatar_url baru
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      // Update UI
      setAvatar(publicUrl)

      toast({
        title: "Avatar berhasil diperbarui",
        description: "Foto profil Anda telah diperbarui dengan gambar yang diupload",
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Gagal mengupload avatar",
        description: error.message || "Terjadi kesalahan saat mengupload avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

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

  async function removeAvatar() {
    if (!avatar) return

    setUploading(true)

    try {
      // Hapus avatar dari storage jika berasal dari Supabase
      if (avatar.includes("supabase.co/storage")) {
        try {
          // Ekstrak path file dari URL
          const urlParts = avatar.split("/")
          const fileName = urlParts[urlParts.length - 1].split("?")[0]

          // Hapus file dari storage
          await supabase.storage.from("avatars").remove([fileName])
        } catch (error) {
          console.error("Error menghapus avatar dari storage:", error)
          // Lanjutkan proses meskipun gagal menghapus dari storage
        }
      }

      // Update user dengan avatar_url null
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        throw updateError
      }

      // Update UI
      setAvatar(null)
      setExternalUrl("")

      toast({
        title: "Avatar berhasil dihapus",
        description: "Foto profil Anda telah dihapus",
      })
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Gagal menghapus avatar",
        description: error.message || "Terjadi kesalahan saat menghapus avatar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Preview Avatar */}
      {avatar && (
        <div className="relative w-24 h-24 mx-auto mb-2">
          <Image
            src={avatar || "/placeholder.svg"}
            alt="Avatar Preview"
            className="rounded-full object-cover border-2 border-amber-200"
            fill
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeAvatar}
            disabled={uploading}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Hapus avatar</span>
          </Button>
        </div>
      )}

      {/* Upload Method Selector */}
      <div className="flex gap-2 mb-1">
        <Button
          type="button"
          variant={uploadMethod === "file" ? "default" : "outline"}
          size="sm"
          className={`flex-1 ${uploadMethod === "file" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-black" : ""}`}
          onClick={() => setUploadMethod("file")}
        >
          <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Upload File
        </Button>
        <Button
          type="button"
          variant={uploadMethod === "url" ? "default" : "outline"}
          size="sm"
          className={`flex-1 ${uploadMethod === "url" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-black" : ""}`}
          onClick={() => setUploadMethod("url")}
        >
          <LinkIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          URL Eksternal
        </Button>
      </div>

      {/* File Upload UI */}
      {uploadMethod === "file" && (
        <div className="flex flex-col gap-2">
          <div className="mb-1 sm:mb-2">
            <h4 className="text-xs sm:text-sm font-medium text-amber-700 mb-0.5 sm:mb-1">Upload Gambar</h4>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">
              Upload gambar dari perangkat Anda (JPG, PNG, GIF, maks 2MB)
            </p>
          </div>

          <div className="border-2 border-dashed border-amber-200 rounded-md p-4 text-center hover:bg-amber-50/50 transition-colors">
            <label htmlFor="avatar-file" className="cursor-pointer flex flex-col items-center justify-center gap-2">
              <ImageIcon className="h-6 w-6 text-amber-500" />
              <span className="text-xs text-amber-700">Klik untuk memilih gambar</span>
              <input
                ref={fileInputRef}
                id="avatar-file"
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full mt-1 sm:mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-2 border-black hover:from-amber-600 hover:to-orange-600 text-xs sm:text-sm py-1.5 sm:py-2"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span>Mengupload...</span>
              </>
            ) : (
              <>
                <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span>Pilih & Upload Gambar</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* URL Input UI */}
      {uploadMethod === "url" && (
        <div className="flex flex-col gap-2">
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
      )}
    </div>
  )
}
