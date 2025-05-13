"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getAuthStats } from "@/lib/auth-monitor"
import { Card, CardContent } from "@/components/ui/card"
import { Smartphone, Laptop, TabletSmartphone } from "lucide-react"

export default function DeviceBreakdown() {
  const [deviceData, setDeviceData] = useState<{
    mobile: number
    desktop: number
    tablet: number
    unknown: number
  }>({
    mobile: 0,
    desktop: 0,
    tablet: 0,
    unknown: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true)
      try {
        const stats = getAuthStats()

        // Hitung berdasarkan perangkat
        const devices = {
          mobile: 0,
          desktop: 0,
          tablet: 0,
          unknown: 0,
        }

        stats.forEach((stat) => {
          const deviceType = stat.details?.device || "unknown"

          if (deviceType.includes("mobile")) {
            devices.mobile += 1
          } else if (deviceType.includes("tablet")) {
            devices.tablet += 1
          } else if (deviceType.includes("desktop")) {
            devices.desktop += 1
          } else {
            devices.unknown += 1
          }
        })

        setDeviceData(devices)
        setTotal(stats.length)
      } catch (error) {
        console.error("Error loading device data:", error)
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

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">Tidak ada data perangkat</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DeviceCard
        title="Mobile"
        count={deviceData.mobile}
        percentage={(deviceData.mobile / total) * 100}
        icon={<Smartphone className="h-8 w-8 text-blue-500" />}
      />
      <DeviceCard
        title="Desktop"
        count={deviceData.desktop}
        percentage={(deviceData.desktop / total) * 100}
        icon={<Laptop className="h-8 w-8 text-green-500" />}
      />
      <DeviceCard
        title="Tablet"
        count={deviceData.tablet}
        percentage={(deviceData.tablet / total) * 100}
        icon={<TabletSmartphone className="h-8 w-8 text-purple-500" />}
      />
    </div>
  )
}

function DeviceCard({
  title,
  count,
  percentage,
  icon,
}: {
  title: string
  count: number
  percentage: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          {icon}
        </div>
        <div className="text-3xl font-bold">{count}</div>
        <div className="text-sm text-muted-foreground mt-1">{percentage.toFixed(1)}% dari total</div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
      </CardContent>
    </Card>
  )
}
