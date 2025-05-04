"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAuthStats, exportAuthStatsCSV, type AuthRequestStats } from "@/lib/auth-monitor"

export default function AuthLogs() {
  const [logs, setLogs] = useState<AuthRequestStats[]>([])
  const [source, setSource] = useState("all")
  const [success, setSuccess] = useState("all")
  const [page, setPage] = useState(1)
  const [isClient, setIsClient] = useState(false)

  const itemsPerPage = 10

  useEffect(() => {
    setIsClient(true)

    // Hanya berjalan di client-side
    if (typeof window !== "undefined") {
      try {
        const stats = getAuthStats()
        setLogs(stats)
      } catch (error) {
        console.error("Error loading auth stats:", error)
      }
    }
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesSource = source === "all" || log.source === source
    const matchesSuccess =
      success === "all" || (success === "success" && log.success) || (success === "failed" && !log.success)

    return matchesSource && matchesSuccess
  })

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const handleExport = () => {
    const csv = exportAuthStatsCSV()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `auth-logs-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tidak ada data log autentikasi</AlertTitle>
          <AlertDescription>
            Log autentikasi hanya tersedia di browser client dan akan hilang saat browser ditutup.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="sm:w-1/4">
            <SelectValue placeholder="Filter Sumber" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Sumber</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="middleware">Middleware</SelectItem>
            <SelectItem value="server">Server</SelectItem>
          </SelectContent>
        </Select>

        <Select value={success} onValueChange={setSuccess}>
          <SelectTrigger className="sm:w-1/4">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="success">Sukses</SelectItem>
            <SelectItem value="failed">Gagal</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExport} className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Durasi (ms)</TableHead>
              <TableHead>Sumber</TableHead>
              <TableHead>Cache</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                  <TableCell>
                    <Badge variant={log.success ? "success" : "destructive"}>{log.success ? "Sukses" : "Gagal"}</Badge>
                  </TableCell>
                  <TableCell>{log.duration.toFixed(2)}</TableCell>
                  <TableCell>{log.source}</TableCell>
                  <TableCell>
                    <Badge variant={log.cached ? "outline" : "secondary"}>{log.cached ? "Ya" : "Tidak"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada data log autentikasi
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {paginatedLogs.length} dari {filteredLogs.length} log
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
