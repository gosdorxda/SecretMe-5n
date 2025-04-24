"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

// Tambahkan konstanta untuk batas maksimum panjang nama
const MAX_NAME_LENGTH = 50

interface NameFormProps {
  userId: string
  currentName: string
}

export function NameForm({ userId, currentName }: NameFormProps) {
  // Ubah state untuk menyimpan nama
  const [name, setName] = useState(currentName || "")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  // Modifikasi fungsi handleChange untuk membatasi panjang input
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (value.length <= MAX_NAME_LENGTH) {
      setName(value)
    }
  }

  // Modifikasi validasi di handleSubmit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Nama tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    if (name.length > MAX_NAME_LENGTH) {
      toast({
        title: "Nama terlalu panjang",
        description: `Nama tidak boleh lebih dari ${MAX_NAME_LENGTH} karakter`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Update nama
      const { error } = await supabase
        .from("users")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (error) {
        throw error
      }

      toast({
        title: "Nama berhasil diperbarui",
        description: "Nama profil Anda telah diperbarui",
      })

      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Gagal memperbarui nama",
        description: error.message || "Terjadi kesalahan saat memperbarui nama",
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
          Nama
        </Label>
        <div className="flex flex-col xs:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              id="name"
              value={name}
              onChange={handleChange}
              placeholder="Nama Anda"
              required
              maxLength={MAX_NAME_LENGTH}
              className="text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || name === currentName || !name.trim()}
            className="h-8 sm:h-10 text-xs sm:text-sm"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
        {/* Tambahkan counter karakter di bawah input */}
        <div className="text-[10px] xs:text-xs flex justify-between">
          <p className="text-muted-foreground">
            Nama akan ditampilkan di profil publik Anda dan dapat diubah kapan saja.
          </p>
          <p className={`${name.length > MAX_NAME_LENGTH * 0.8 ? "text-amber-500" : "text-muted-foreground"}`}>
            {name.length}/{MAX_NAME_LENGTH}
          </p>
        </div>
      </div>
    </form>
  )
}
