"use client"

import { useEffect, useState } from "react"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  // Gunakan state untuk mencegah hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  const { toasts } = useToast()

  useEffect(() => {
    setIsMounted(true)

    // Cleanup function untuk menghapus semua toast yang mungkin tertinggal
    return () => {
      document.querySelectorAll('[role="status"]').forEach((el) => {
        el.remove()
      })
    }
  }, [])

  // Jangan render apa pun selama SSR untuk mencegah hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast
          key={id}
          {...props}
          className="Toaster_ToastRoot relative transform-none hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-200 p-4 backdrop-blur-none"
          style={{ backdropFilter: "none" }}
        >
          <div className="grid gap-1">
            {title && <ToastTitle className="text-sm font-bold">{title}</ToastTitle>}
            {description && <ToastDescription className="text-xs">{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport className="!gap-2" />
    </ToastProvider>
  )
}
