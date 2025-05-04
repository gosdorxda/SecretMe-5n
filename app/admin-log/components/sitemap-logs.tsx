"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/pagination"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface SitemapLogsProps {
  initialLogs: any[]
}

export default function SitemapLogs({ initialLogs }: SitemapLogsProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [page, setPage] = useState(1)

  const itemsPerPage = 10
  const totalPages = Math.ceil(logs.length / itemsPerPage)

  const paginatedLogs = logs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Jumlah User</TableHead>
              <TableHead>Terakhir Diperbarui</TableHead>
              <TableHead>Dipicu Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.triggered_at)}</TableCell>
                  <TableCell>{log.user_count}</TableCell>
                  <TableCell>{formatDate(log.last_updated)}</TableCell>
                  <TableCell>
                    <Badge variant={log.triggered_by === "manual" ? "outline" : "secondary"}>
                      {log.triggered_by === "manual"
                        ? "Manual"
                        : log.triggered_by === "cron"
                          ? "Cron Job"
                          : log.triggered_by}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Tidak ada data log sitemap
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {paginatedLogs.length} dari {logs.length} log
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
