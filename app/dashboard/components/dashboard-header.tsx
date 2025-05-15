"use client"
import type { Database } from "@/lib/supabase/database.types"
import { MessageSquare } from "lucide-react"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface DashboardHeaderProps {
  user: UserType
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="mt-6 mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Halo, <span className="text-gradient">{user.name}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Selamat datang kembali di dashboard Anda</p>
        </div>
      </div>
    </div>
  )
}
