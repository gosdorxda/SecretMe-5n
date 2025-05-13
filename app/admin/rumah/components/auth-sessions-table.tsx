"use client"

import { useState, useEffect } from "react"
import { getAuthStats } from "@/lib/auth-monitor"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default function AuthSessionsTable() {
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true)
      try {
        const stats = getAuthStats()

        // Filter hanya sesi yang berhasil
        const successfulSessions = stats.filter((s) => s.success && s.source !== "cache/get")

        // Ambil 20 sesi terbaru
        const latestSessions = successfulSessions.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)

        setSessions(latestSessions)
      } catch (error) {
        console.error("Error loading sessions data:", error)
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

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">Tidak ada data sesi autentikasi</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead>Durasi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cache</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session, index) => (
            <TableRow key={index}>
              <TableCell>{format(new Date(session.timestamp), "dd MMM yyyy HH:mm:ss", { locale: id })}</TableCell>
              <TableCell>{session.endpoint}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {session.source}
                </Badge>
              </TableCell>
              <TableCell>{session.duration.toFixed(2)}ms</TableCell>
              <TableCell>
                <Badge variant="success">Berhasil</Badge>
              </TableCell>
              <TableCell>
                {session.cached ? <Badge variant="secondary">Cache</Badge> : <Badge variant="outline">Live</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
