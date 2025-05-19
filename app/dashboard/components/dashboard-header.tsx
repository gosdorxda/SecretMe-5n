"use client"
import { useLanguage } from "@/lib/i18n/language-context"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface DashboardHeaderProps {
  user: UserType
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { t } = useLanguage()

  return (
    <div className="mt-6 mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t.dashboard.header.greeting}, <span className="text-gradient">{user.name}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">{t.dashboard.header.welcome}</p>
        </div>
      </div>
    </div>
  )
}
