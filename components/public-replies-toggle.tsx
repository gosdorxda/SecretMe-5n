"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, AlertCircle } from "lucide-react"

interface PublicRepliesToggleProps {
  userId: string
  initialValue: boolean
  minimal?: boolean
  onToggleChange?: (checked: boolean) => void
}

export function PublicRepliesToggle({
  userId,
  initialValue,
  minimal = false,
  onToggleChange,
}: PublicRepliesToggleProps) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const handleToggleChange = async (checked: boolean) => {
    setIsUpdating(true)
    setError(null)

    try {
      // Verificar primero si la columna existe
      try {
        const { error: checkError } = await supabase
          .from("users")
          .select("allow_public_replies")
          .eq("id", userId)
          .limit(1)

        if (checkError && checkError.message?.includes("column") && checkError.message?.includes("does not exist")) {
          // La columna no existe, mostrar mensaje de error
          setError("Fitur ini memerlukan pembaruan database. Silakan jalankan migrasi database terlebih dahulu.")
          console.error("Column allow_public_replies does not exist:", checkError)
          return
        }
      } catch (checkErr) {
        console.error("Error checking column existence:", checkErr)
      }

      // Actualizar el valor en la base de datos
      const { error: updateError } = await supabase
        .from("users")
        .update({ allow_public_replies: checked })
        .eq("id", userId)

      if (updateError) {
        if (updateError.message?.includes("column") && updateError.message?.includes("does not exist")) {
          setError("Fitur ini memerlukan pembaruan database. Silakan jalankan migrasi database terlebih dahulu.")
          console.error("Column allow_public_replies does not exist:", updateError)
          return
        } else {
          throw updateError
        }
      }

      setEnabled(checked)

      // Call the onToggleChange callback if provided
      if (onToggleChange) {
        onToggleChange(checked)
      }

      toast({
        title: checked ? "Balasan publik diaktifkan" : "Balasan publik dinonaktifkan",
        description: checked
          ? "Pengunjung dapat membalas pesan yang telah Anda balas"
          : "Hanya Anda yang dapat membalas pesan",
      })
    } catch (error: any) {
      console.error("Error updating public replies setting:", error)
      toast({
        title: "Gagal memperbarui pengaturan",
        description: error.message || "Terjadi kesalahan saat memperbarui pengaturan balasan publik",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      {minimal ? (
        <Switch
          id="public-replies"
          checked={enabled}
          onCheckedChange={handleToggleChange}
          disabled={isUpdating || !!error}
        />
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-white/50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Balasan Publik</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {enabled
                    ? "Pengunjung dapat membalas pesan yang telah Anda balas"
                    : "Hanya Anda yang dapat membalas pesan"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-replies"
                  checked={enabled}
                  onCheckedChange={handleToggleChange}
                  disabled={isUpdating || !!error}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-amber-800">{error}</p>
                <p className="text-xs text-amber-700 mt-1">
                  Jalankan SQL berikut di database Anda:
                  <code className="block mt-1 p-2 bg-amber-100 rounded text-amber-900 text-[10px] overflow-x-auto">
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_public_replies BOOLEAN DEFAULT false;
                  </code>
                </p>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-500 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <p className="text-xs text-blue-700">
                Saat diaktifkan, pengunjung dapat membalas pesan yang telah Anda balas. Saat dinonaktifkan, hanya Anda
                yang dapat membalas pesan.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
