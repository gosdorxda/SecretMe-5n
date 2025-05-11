"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { DashboardHeader } from "./components/dashboard-header"
import { PremiumBanner } from "./components/premium-banner"
import { ProfileQuickView } from "./components/profile-quick-view"
import { StatisticsCards } from "./components/statistics-cards"
import { DashboardTabs } from "./components/dashboard-tabs"

type UserType = Database["public"]["Tables"]["users"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

interface DashboardClientProps {
  user: UserType
  messages: Message[]
}

export function DashboardClient({ user, messages }: DashboardClientProps) {
  const [viewCount, setViewCount] = useState(0)
  const supabase = createClient()

  // Fetch view count data
  useEffect(() => {
    const fetchViewCount = async () => {
      try {
        // Ambil data tayangan dari tabel profile_views
        const { data, error } = await supabase.from("profile_views").select("count").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching view count:", error)
          return
        }

        // Jika data ditemukan, gunakan nilai count
        // Jika tidak, gunakan nilai default 0
        setViewCount(data?.count || 0)
      } catch (error) {
        console.error("Error fetching view count:", error)
      }
    }

    fetchViewCount()
  }, [supabase, user.id])

  return (
    <div className="w-full max-w-[56rem] mx-auto px-4 sm:px-6">
      <DashboardHeader user={user} />
      <ProfileQuickView user={user} />
      <PremiumBanner user={user} />
      <StatisticsCards messages={messages} viewCount={viewCount} />
      <DashboardTabs user={user} messages={messages} viewCount={viewCount} />
    </div>
  )
}
