"use client"

import { useState, useEffect } from "react"
import { getAuthStats } from "@/lib/auth-monitor"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { AlertTriangle } from "lucide-react"

export default function AuthErrorsPanel() {
  const [errors, setErrors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true)
      try {
        const stats = getAuthStats()

        // Filter hanya error
        const failedRequests = stats.filter((s) => !s.success)

        // Ambil 20 error terbaru
        const latestErrors = failedRequests.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)

        setErrors(latestErrors)
      } catch (error) {
        console.error("Error loading errors data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    // Refresh data setiap 30 detik
    const interval = setInterval(loadData, 30 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    )
  }

  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-green-600 font-medium">Tidak ada error autentikasi yang terdeteksi</p>
        <p className="text-muted-foreground text-sm mt-1">Sistem autentikasi berjalan dengan baik</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Terdeteksi {errors.length} error autentikasi</p>
          <p className="text-xs text-amber-700 mt-1">
            Error autentikasi dapat menyebabkan pengguna tidak dapat masuk atau mengakses fitur tertentu.
          </p>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error, index) => (
              <TableRow key={index}>
                <TableCell>{format(new Date(error.timestamp), "dd MMM yyyy HH:mm:ss", { locale: id })}</TableCell>
                <TableCell>{error.endpoint}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {error.source}
                  </Badge>
                </TableCell>
                <TableCell>{error.duration.toFixed(2)}ms</TableCell>
                <TableCell>
                  <Badge variant="destructive">{error.details?.errorCode || "Unknown Error"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
