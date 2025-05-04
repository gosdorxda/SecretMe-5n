"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function AccessLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [hasLoaded, setHasLoaded] = useState(false)

  const itemsPerPage = 10

  const loadLogs = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Ambil log rate limit dari tabel yang sesuai
      // Catatan: Ini contoh, sesuaikan dengan struktur database yang sebenarnya
      const { data, error } = await supabase
        .from("rate_limit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error

      setLogs(data || [])
      setHasLoaded(true)
    } catch (error) {
      console.error("Error loading access logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = search === "" || log.ip?.includes(search) || log.path?.includes(search)

    const matchesStatus =
      status === "all" || (status === "blocked" && log.blocked) || (status === "allowed" && !log.blocked)

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="space-y-4">
      {!hasLoaded && !loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Log akses belum dimuat</AlertTitle>
          <AlertDescription>Klik tombol Muat Log untuk menampilkan data log akses dan rate limit.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={loadLogs} disabled={loading} className="sm:w-1/4">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Memuat..." : "Muat Log"}
        </Button>

        <Input
          placeholder="Cari berdasarkan IP atau Path"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-1/3"
          disabled={!hasLoaded}
        />

        <Select value={status} onValueChange={setStatus} disabled={!hasLoaded}>
          <SelectTrigger className="sm:w-1/4">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="blocked">Diblokir</SelectItem>
            <SelectItem value="allowed">Diizinkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">{log.path}</TableCell>
                  <TableCell>{log.method}</TableCell>
                  <TableCell>
                    <Badge variant={log.blocked ? "destructive" : "success"}>
                      {log.blocked ? "Diblokir" : "Diizinkan"}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.rate ? `${log.rate}/${log.limit}` : "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {hasLoaded ? "Tidak ada data log akses" : "Klik tombol Muat Log untuk menampilkan data"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hasLoaded && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Menampilkan {paginatedLogs.length} dari {filteredLogs.length} log
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
