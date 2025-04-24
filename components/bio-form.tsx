"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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
        title: "Bio berhasil diperbarui",
        description: "Deskripsi profil Anda telah diperbarui",
      })

      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Gagal memperbarui bio",
        description: error.message || "Terjadi kesalahan saat memperbarui deskripsi profil",
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
          Bio / Deskripsi Singkat
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Ceritakan sedikit tentang diri Anda..."
          rows={3}
          maxLength={300}
          className="resize-none w-full text-xs sm:text-sm"
        />
        <p className="text-[10px] xs:text-xs text-muted-foreground text-right">{bio.length}/300 karakter</p>
      </div>
      <Button
        type="submit"
        disabled={isLoading || bio === currentBio}
        className="w-full h-8 sm:h-10 text-xs sm:text-sm"
      >
        {isLoading ? "Menyimpan..." : "Simpan Bio"}
      </Button>
    </form>
  )
}
