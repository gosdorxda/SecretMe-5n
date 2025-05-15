"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Crown, LogOut, Settings } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface SettingsTabProps {
  user: UserType
}

export function SettingsTab({ user }: SettingsTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handleLogout() {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Logout gagal",
        description: error.message || "Terjadi kesalahan saat logout",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className="neo-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Pengaturan Akun
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium mb-3 text-sm sm:text-base">Informasi Akun</h3>
              <div className="space-y-3">
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                  <span className="text-xs text-gray-500 w-20">Nama:</span>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                  <span className="text-xs text-gray-500 w-20">Email:</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                  <span className="text-xs text-gray-500 w-20">Status:</span>
                  <span className="text-sm">
                    {user.is_premium ? (
                      <Badge className="bg-[rgb(250,204,21)] text-black border border-amber-500 rounded-[var(--border-radius)] text-[10px] font-normal">
                        <Crown className="h-2.5 w-2.5 mr-1" />
                        <span>Premium</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-normal">
                        Gratis
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                  <span className="text-xs text-gray-500 w-20">Bergabung:</span>
                  <span className="text-xs text-gray-600">
                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium mb-3 text-sm sm:text-base">Keluar Akun</h3>
              <p className="text-xs text-gray-500 mb-3">
                Keluar dari akun Anda pada perangkat ini. Anda dapat masuk kembali kapan saja.
              </p>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full sm:w-auto neo-btn-outline"
              >
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Keluar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
