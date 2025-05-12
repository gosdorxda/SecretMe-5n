"use client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface DashboardHeaderProps {
  user: UserType
  onLogout: () => Promise<void>
}

export function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4 mb-4">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang, {user.name || "Pengguna"}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  )
}
