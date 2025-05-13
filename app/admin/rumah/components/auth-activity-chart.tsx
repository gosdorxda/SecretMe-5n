"use client"

import { useState, useEffect } from "react"
import { getAuthStats } from "@/lib/auth-monitor"

export default function AuthActivityChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true)
      try {
        const stats = getAuthStats()

        // Hanya ambil data 24 jam terakhir
        const now = Date.now()
        const last24Hours = stats.filter((s) => s.timestamp > now - 24 * 60 * 60 * 1000)

        // Kelompokkan data per jam
        const hourlyData: Record<string, { success: number; failed: number; timestamp: number }> = {}

        last24Hours.forEach((stat) => {
          const hour = new Date(stat.timestamp).setMinutes(0, 0, 0)
          const hourKey = hour.toString()

          if (!hourlyData[hourKey]) {
            hourlyData[hourKey] = { success: 0, failed: 0, timestamp: hour }
          }

          if (stat.success) {
            hourlyData[hourKey].success += 1
          } else {
            hourlyData[hourKey].failed += 1
          }
        })

        // Konversi ke array untuk chart
        const chartDataArray = Object.values(hourlyData).sort((a, b) => a.timestamp - b.timestamp)

        setChartData(chartDataArray)
      } catch (error) {
        console.error("Error loading chart data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    // Refresh data setiap 5 menit
    const interval = setInterval(loadData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">Tidak ada data aktivitas autentikasi dalam 24 jam terakhir</p>
      </div>
    )
  }

  // Dalam implementasi nyata, Anda akan menggunakan library chart seperti Chart.js atau Recharts
  // Untuk saat ini, kita akan menampilkan visualisasi sederhana
  return (
    <div className="h-64 relative">
      <div className="absolute inset-0 flex items-end">
        {chartData.map((hour, index) => {
          const totalRequests = hour.success + hour.failed
          const maxHeight = 150 // Tinggi maksimum bar dalam pixel
          const successHeight = totalRequests > 0 ? (hour.success / totalRequests) * maxHeight : 0
          const failedHeight = totalRequests > 0 ? (hour.failed / totalRequests) * maxHeight : 0

          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full px-1">
                <div
                  className="bg-red-500 w-full"
                  style={{ height: `${failedHeight}px` }}
                  title={`Gagal: ${hour.failed}`}
                ></div>
                <div
                  className="bg-green-500 w-full"
                  style={{ height: `${successHeight}px` }}
                  title={`Berhasil: ${hour.success}`}
                ></div>
              </div>
              <div className="text-xs mt-2 transform -rotate-45 origin-top-left">
                {new Date(hour.timestamp).getHours()}:00
              </div>
            </div>
          )
        })}
      </div>
      <div className="absolute top-0 left-0 flex flex-col justify-between h-full py-2">
        <div className="text-xs text-muted-foreground">Max</div>
        <div className="text-xs text-muted-foreground">0</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-8">
        <div className="text-xs text-muted-foreground">24 jam lalu</div>
        <div className="text-xs text-muted-foreground">Sekarang</div>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span className="text-xs">Berhasil</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <span className="text-xs">Gagal</span>
        </div>
      </div>
    </div>
  )
}
