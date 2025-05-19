"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"

interface NameFormProps {
  userId: string
  currentName: string
}

export function NameForm({ userId, currentName }: NameFormProps) {
  const [name, setName] = useState(currentName)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  const { locale } = useLanguage()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: locale === "en" ? "Name cannot be empty" : "Nama tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    if (name.trim() === currentName) {
      toast({
        title: locale === "en" ? "No changes to save" : "Tidak ada perubahan untuk disimpan",
        description: locale === "en" ? "The name is the same as the current one" : "Nama sama dengan yang saat ini",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) {
        throw error
      }

      toast({
        title: locale === "en" ? "Name updated" : "Nama berhasil diperbarui",
        description:
          locale === "en"
            ? "Your profile has been updated with the new name"
            : "Profil Anda telah diperbarui dengan nama baru",
      })

      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: locale === "en" ? "Failed to update name" : "Gagal memperbarui nama",
        description:
          error.message ||
          (locale === "en" ? "An error occurred while updating name" : "Terjadi kesalahan saat memperbarui nama"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1 sm:space-y-2">
        <Label htmlFor="name" className="text-xs sm:text-sm">
          {locale === "en" ? "Name" : "Nama"}
        </Label>
        <div className="flex flex-col xs:flex-row gap-2">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={locale === "en" ? "Your name" : "Nama Anda"}
            required
            className="text-xs sm:text-sm h-8 sm:h-10"
          />
          <Button
            type="submit"
            disabled={isLoading || !name.trim() || name.trim() === currentName}
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            {isLoading ? (locale === "en" ? "Saving..." : "Menyimpan...") : locale === "en" ? "Save" : "Simpan"}
          </Button>
        </div>
      </div>
    </form>
  )
}
