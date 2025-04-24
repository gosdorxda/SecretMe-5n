"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { StickyNotification, type NotificationType } from "@/components/sticky-notification"
import { createClient } from "@/lib/supabase/client"

type NotificationOptions = {
  id: string
  message: string | React.ReactNode
  type?: NotificationType
  showIcon?: boolean
  duration?: number | null
  action?: React.ReactNode
}

type NotificationContextType = {
  showNotification: (options: NotificationOptions) => void
  hideNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function StickyNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationOptions[]>([])

  // Ambil notifikasi aktif dari database
  useEffect(() => {
    const fetchActiveNotifications = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("notifications").select("*").eq("is_active", true)

      if (!error && data) {
        // Tampilkan semua notifikasi aktif
        data.forEach((notification) => {
          const action = notification.action_text ? (
            <a href={notification.action_url || "#"} className="underline">
              {notification.action_text}
            </a>
          ) : undefined

          showNotification({
            id: notification.notification_id,
            message: notification.message,
            type: notification.type,
            showIcon: notification.show_icon,
            duration: notification.duration,
            action,
          })
        })
      }
    }

    fetchActiveNotifications()
  }, [])

  const showNotification = useCallback((options: NotificationOptions) => {
    setNotifications((prev) => {
      // Remove any existing notification with the same ID
      const filtered = prev.filter((n) => n.id !== options.id)
      return [...filtered, options]
    })
  }, [])

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {notifications.map((notification) => (
        <StickyNotification key={notification.id} {...notification} onClose={() => hideNotification(notification.id)} />
      ))}
      {children}
    </NotificationContext.Provider>
  )
}

export function useStickyNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useStickyNotification must be used within a StickyNotificationProvider")
  }
  return context
}
