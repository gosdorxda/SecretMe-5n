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

interface TransactionLogsProps {
  initialLogs: any[]
}

export default function TransactionLogs({ initialLogs }: TransactionLogsProps) {
  const [logs, setLogs] = useState(initialLogs)
  const [search, setSearch] = useState("")
  const [eventType, setEventType] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)

  const itemsPerPage = 10
  const totalPages = Math.ceil(logs.length / itemsPerPage)

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search === "" ||
      log.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.transaction_id?.toString().includes(search)

    const matchesEventType = eventType === "all" || log.event_type === eventType
    const matchesStatus = status === "all" || log.status === status

    return matchesSearch && matchesEventType && matchesStatus
  })

  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const getStatusColor = (status: string) => {
    if (!status) return "default"

    if (status.toLowerCase().includes("success")) return "success"
    if (status.toLowerCase().includes("pending")) return "warning"
    if (status.toLowerCase().includes("fail") || status.toLowerCase().includes("error")) return "destructive"

    return "default"
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "create":
        return "Dibuat"
      case "update":
        return "Diperbarui"
      case "verify":
        return "Verifikasi"
      case "notification":
        return "Notifikasi"
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Cari berdasarkan Order ID atau Transaction ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-1/3"
        />

        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="sm:w-1/4">
            <SelectValue placeholder="Filter Tipe Event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="create">Dibuat</SelectItem>
            <SelectItem value="update">Diperbarui</SelectItem>
            <SelectItem value="verify">Verifikasi</SelectItem>
            <SelectItem value="notification">Notifikasi</SelectItem>
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
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Tipe Event</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                  <TableCell>{getEventTypeLabel(log.event_type)}</TableCell>
                  <TableCell>{log.transaction_id}</TableCell>
                  <TableCell>{log.order_id}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(log.status)}>{log.status}</Badge>
                  </TableCell>
                  <TableCell>{log.gateway}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detail Log Transaksi</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <h3 className="text-lg font-medium">Informasi Transaksi</h3>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="font-medium">ID</div>
                            <div>{log.id}</div>
                            <div className="font-medium">Transaction ID</div>
                            <div>{log.transaction_id}</div>
                            <div className="font-medium">Order ID</div>
                            <div>{log.order_id}</div>
                            <div className="font-medium">User ID</div>
                            <div className="font-mono text-xs">{log.user_id}</div>
                            <div className="font-medium">Gateway</div>
                            <div>{log.gateway}</div>
                            <div className="font-medium">Tipe Event</div>
                            <div>{getEventTypeLabel(log.event_type)}</div>
                            <div className="font-medium">Status</div>
                            <div>
                              <Badge variant={getStatusColor(log.status)}>{log.status}</Badge>
                            </div>
                            {log.previous_status && (
                              <>
                                <div className="font-medium">Status Sebelumnya</div>
                                <div>
                                  <Badge variant={getStatusColor(log.previous_status)}>{log.previous_status}</Badge>
                                </div>
                              </>
                            )}
                            <div className="font-medium">Metode Pembayaran</div>
                            <div>{log.payment_method || "-"}</div>
                            <div className="font-medium">Jumlah</div>
                            <div>{log.amount ? `Rp ${log.amount.toLocaleString("id-ID")}` : "-"}</div>
                            <div className="font-medium">Waktu</div>
                            <div>{formatDate(log.created_at)}</div>
                          </div>

                          {log.details && (
                            <>
                              <h3 className="text-lg font-medium mt-4">Detail</h3>
                              <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto text-xs">
                                {JSON.stringify(log.details, null, 2)}
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada data log transaksi
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
