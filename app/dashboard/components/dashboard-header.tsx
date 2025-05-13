"use client"
import type { Database } from "@/lib/supabase/database.types"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useState } from "react"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface DashboardHeaderProps {
  user: UserType
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { forceLogout } = useAuth()
  const [showEmergencyLogout, setShowEmergencyLogout] = useState(false)

  return (
    <div className="mt-6 mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Halo, <span className="text-gradient">{user.name}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Selamat datang kembali di dashboard Anda</p>
        </div>

        {/* Tambahkan tombol emergency logout */}
        <div className="flex items-center">
          {showEmergencyLogout ? (
            <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg">
              <Button variant="destructive" size="sm" onClick={forceLogout} className="flex items-center gap-1">
                <AlertTriangle size={16} />
                Force Logout
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowEmergencyLogout(false)}>
                Batal
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmergencyLogout(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              Masalah Login?
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
