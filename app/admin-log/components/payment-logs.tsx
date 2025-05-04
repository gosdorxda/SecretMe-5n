"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PaymentLogsProps {
  initialLogs: any[]
}

export default function PaymentLogs({ initialLogs }: PaymentLogsProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [search, setSearch] = useState("")
  const [gateway, setGateway] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const itemsPerPage = 10
  const totalPages = Math.ceil(logs.length / itemsPerPage)

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.request_id?.toLowerCase().includes(search.toLowerCase())

    const matchesGateway = gateway === "all" || log.gateway === gateway
    const matchesStatus = status === "all" || log.status === status

    return matchesSearch && matchesGateway && matchesStatus
  })

  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const getStatusColor = (status: string) => {
    if (!status) return "default"

    if (status.toLowerCase().includes("success")) return "success"
    if (status.toLowerCase().includes("pending")) return "warning"
    if (status.toLowerCase().includes("fail") || status.toLowerCase().includes("error")) return "destructive"

    return "default"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Cari berdasarkan Order ID atau Request ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-1/3"
        />

        <Select value={gateway} onValueChange={setGateway}>
          <SelectTrigger className="sm:w-1/4">
            <SelectValue placeholder="Filter Gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Gateway</SelectItem>
            <SelectItem value="duitku">Duitku</SelectItem>
            <SelectItem value="tripay">Tripay</SelectItem>
            <SelectItem value="midtrans">Midtrans</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-1/4">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="success">Sukses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Gagal</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request ID</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                  <TableCell className="font-medium">{log.gateway}</TableCell>
                  <TableCell>{log.order_id}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(log.status)}>{log.status || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.request_id}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detail Log Pembayaran</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <h3 className="text-lg font-medium">Informasi Dasar</h3>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="font-medium">ID</div>
                            <div>{log.id}</div>
                            <div className="font-medium">Gateway</div>
                            <div>{log.gateway}</div>
                            <div className="font-medium">Order ID</div>
                            <div>{log.order_id}</div>
                            <div className="font-medium">Request ID</div>
                            <div className="font-mono text-xs">{log.request_id}</div>
                            <div className="font-medium">Status</div>
                            <div>
                              <Badge variant={getStatusColor(log.status)}>{log.status || "Unknown"}</Badge>
                            </div>
                            <div className="font-medium">Waktu</div>
                            <div>{formatDate(log.created_at)}</div>
                          </div>

                          <h3 className="text-lg font-medium mt-4">Raw Payload</h3>
                          <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto text-xs">
                            {JSON.stringify(log.raw_payload, null, 2)}
                          </pre>

                          <h3 className="text-lg font-medium mt-4">Parsed Payload</h3>
                          <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto text-xs">
                            {JSON.stringify(log.parsed_payload, null, 2)}
                          </pre>

                          {log.error && (
                            <>
                              <h3 className="text-lg font-medium mt-4">Error</h3>
                              <pre className="bg-destructive/10 text-destructive p-4 rounded-md mt-2 overflow-x-auto text-xs">
                                {log.error}
                              </pre>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada data log pembayaran
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
