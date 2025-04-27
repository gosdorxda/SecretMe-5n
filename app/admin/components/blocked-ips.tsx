"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface BlockedIP {
  id: string
  ip_address: string
  reason: string | null
  blocked_at: string
  blocked_until: string | null
  is_permanent: boolean
}

export default function BlockedIPs() {
  const [loading, setLoading] = useState(true)
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchBlockedIPs()
  }, [])

  async function fetchBlockedIPs() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("blocked_ips").select("*").order("blocked_at", { ascending: false })

      if (error) {
        throw error
      }

      setBlockedIPs(data || [])
    } catch (error) {
      console.error("Error fetching blocked IPs:", error)
      toast({
        title: "Error",
        description: "Gagal memuat daftar IP yang diblokir",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function unblockIP(id: string) {
    try {
      const { error } = await supabase.from("blocked_ips").delete().eq("id", id)

      if (error) {
        throw error
      }

      setBlockedIPs((prev) => prev.filter((ip) => ip.id !== id))
      toast({
        title: "Sukses",
        description: "IP berhasil dihapus dari daftar blokir",
      })
    } catch (error) {
      console.error("Error unblocking IP:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus IP dari daftar blokir",
        variant: "destructive",
      })
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>IP yang Diblokir</CardTitle>
        <CardDescription>Kelola IP yang diblokir karena aktivitas mencurigakan</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Memuat...</p>
        ) : blockedIPs.length === 0 ? (
          <p>Tidak ada IP yang diblokir saat ini.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Diblokir Pada</TableHead>
                <TableHead>Diblokir Hingga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedIPs.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell>{ip.ip_address}</TableCell>
                  <TableCell>{ip.reason || "-"}</TableCell>
                  <TableCell>{formatDate(ip.blocked_at)}</TableCell>
                  <TableCell>{formatDate(ip.blocked_until)}</TableCell>
                  <TableCell>{ip.is_permanent ? "Permanen" : "Sementara"}</TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => unblockIP(ip.id)}>
                      Hapus Blokir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
