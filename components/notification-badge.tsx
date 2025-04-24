"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

interface NotificationBadgeProps {
  userId: string
}

export function NotificationBadge({ userId }: NotificationBadgeProps) {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial notification count
    const fetchNotifications = async () => {
      const { count, error } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending")

      if (!error && count !== null) {
        setCount(count)
      }
    }

    fetchNotifications()

    // Subscribe to changes in the notification_logs table
    const channel = supabase
      .channel("notification_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_logs",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setCount((prevCount) => prevCount + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  if (count === 0) {
    return <Bell className="h-5 w-5 text-gray-500" />
  }

  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-amber-500" />
      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
        {count > 9 ? "9+" : count}
      </Badge>
    </div>
  )
}
