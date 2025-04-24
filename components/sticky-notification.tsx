"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Info, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Komponen StickyNotification - Reusable notification banner
 *
 * Komponen ini dapat digunakan untuk menampilkan notifikasi yang melekat di bagian atas halaman.
 * Sudah diimplementasikan di halaman admin dan dapat digunakan di seluruh aplikasi.
 *
 * Contoh penggunaan:
 * <StickyNotification
 *   id="welcome-message"
 *   message="Selamat datang di SecretMe!"
 *   type="info"
 * />
 */
export type NotificationType = "info" | "success" | "warning" | "error"

interface StickyNotificationProps {
  id: string
  message: string | React.ReactNode
  type?: NotificationType
  showIcon?: boolean
  duration?: number | null // null means it won't auto-dismiss
  onClose?: () => void
  action?: React.ReactNode
}

export function StickyNotification({
  id,
  message,
  type = "info",
  showIcon = true,
  duration = null,
  onClose,
  action,
}: StickyNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Check if notification was previously dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem(`notification-${id}-dismissed`)
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [id])

  // Auto-dismiss after duration if specified
  useEffect(() => {
    if (duration && isVisible) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, isVisible])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem(`notification-${id}-dismissed`, "true")
    if (onClose) onClose()
  }

  // If not visible, don't render anything
  if (!isVisible) return null

  // Determine background color based on type
  const bgColors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  }

  // Determine icon based on type
  const icons = {
    info: <Info className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    error: <AlertTriangle className="h-5 w-5" />,
  }

  return (
    // PERHATIAN: Komponen ini digunakan langsung di app/layout.tsx dan akan muncul di seluruh aplikasi
    // Untuk menonaktifkannya, hapus atau komentar komponen StickyNotification di app/layout.tsx
    <div
      className={cn(
        "sticky top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out",
        bgColors[type],
        "text-white border-b-2 border-black shadow-[0_2px_0_rgba(0,0,0,0.1)]",
      )}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            {showIcon && <div className="flex-shrink-0">{icons[type]}</div>}
            <div className="flex-1">{message}</div>
          </div>
          <div className="flex items-center gap-2">
            {action && <div className="mr-2">{action}</div>}
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close notification"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
