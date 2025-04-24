"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StickyNotification } from "@/components/sticky-notification"

export function NotificationDemo() {
  const [showInfo, setShowInfo] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showError, setShowError] = useState(false)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Notification Demo</h2>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setShowInfo(true)} variant="outline">
          Show Info
        </Button>
        <Button onClick={() => setShowSuccess(true)} variant="outline">
          Show Success
        </Button>
        <Button onClick={() => setShowWarning(true)} variant="outline">
          Show Warning
        </Button>
        <Button onClick={() => setShowError(true)} variant="outline">
          Show Error
        </Button>
      </div>

      {showInfo && (
        <StickyNotification
          id="demo-info"
          message="Ini adalah notifikasi informasi"
          type="info"
          onClose={() => setShowInfo(false)}
        />
      )}

      {showSuccess && (
        <StickyNotification
          id="demo-success"
          message="Operasi berhasil dilakukan!"
          type="success"
          onClose={() => setShowSuccess(false)}
        />
      )}

      {showWarning && (
        <StickyNotification
          id="demo-warning"
          message="Perhatian! Ini adalah peringatan penting."
          type="warning"
          onClose={() => setShowWarning(false)}
        />
      )}

      {showError && (
        <StickyNotification
          id="demo-error"
          message="Terjadi kesalahan. Silakan coba lagi."
          type="error"
          onClose={() => setShowError(false)}
        />
      )}
    </div>
  )
}
