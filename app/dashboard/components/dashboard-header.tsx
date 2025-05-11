"use client"

import { Crown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface DashboardHeaderProps {
  user: UserType
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="mt-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Halo, <span className="text-gradient">{user.name}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Selamat datang kembali di dashboard Anda</p>
        </div>

        <div className="flex items-center gap-2">
          {!user.is_premium && (
            <Button asChild variant="warning" size="sm" className="neo-btn gap-1 animate-pulse">
              <Link href="/premium">
                <Crown className="h-4 w-4 mr-1" />
                <span>Upgrade ke Premium</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
