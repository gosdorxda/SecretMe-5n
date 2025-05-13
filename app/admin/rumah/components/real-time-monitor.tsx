"use client"

import { useState, useEffect, useRef } from "react"
import { getAuthStats } from "@/lib/auth-monitor"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CheckCircle, XCircle } from "lucide-react"

export default function RealTimeMonitor() {
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isActive, setIsActive] = useState(true)
  const activityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadInitialData = () => {
      try {
        const stats = getAuthStats()

        // Ambil 10 aktivitas terbaru
        const latestActivity = stats.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)

        setRecentActivity(latestActivity)
      } catch (error) {
        console.error("Error loading initial activity data:", error)
      }
    }

    loadInitialData()

    // Setup polling untuk data real-time (setiap 5 detik)
    const interval = setInterval(() => {
      if (isActive) {
        try {
          const stats = getAuthStats()

          // Ambil aktivitas terbaru yang belum ada di state
          const latestTimestamp = recentActivity.length > 0 ? recentActivity[0].timestamp : 0
          const newActivity = stats
            .filter((s) => s.timestamp > latestTimestamp)
            .sort((a, b) => b.timestamp - a.timestamp)

          if (newActivity.length > 0) {
            setRecentActivity((prev) => [...newActivity, ...prev].slice(0, 50))

            // Auto-scroll ke aktivitas terbaru
            if (activityRef.current) {
              activityRef.current.scrollTop = 0
            }
          }
        } catch (error) {
          console.error("Error updating real-time activity:", error)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isActive, recentActivity])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`}></div>
          <span className="text-sm font-medium">{isActive ? "Monitoring Aktif" : "Monitoring Dijeda"}</span>
        </div>
        <button onClick={() => setIsActive(!isActive)} className="text-sm text-blue-600 hover:underline">
          {isActive ? "Jeda" : "Lanjutkan"}
        </button>
      </div>

      <div ref={activityRef} className="border rounded-md h-96 overflow-y-auto">
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">Menunggu aktivitas autentikasi...</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {activity.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium">
                        {activity.endpoint}
                        <Badge variant="outline" className="ml-2 capitalize">
                          {activity.source}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Durasi: {activity.duration.toFixed(2)}ms
                        {activity.cached && <span className="ml-2 text-blue-600">Cached</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-right text-muted-foreground">
                    {format(new Date(activity.timestamp), "HH:mm:ss", { locale: id })}
                  </div>
                </div>

                {activity.details && (
                  <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(activity.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
