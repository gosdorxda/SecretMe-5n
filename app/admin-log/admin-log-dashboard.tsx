"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PaymentLogs from "./components/payment-logs"
import TransactionLogs from "./components/transaction-logs"
import SitemapLogs from "./components/sitemap-logs"
import AuthLogs from "./components/auth-logs"
import AccessLogs from "./components/access-logs"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminLogDashboardProps {
  initialPaymentLogs: any[]
  initialTransactionLogs: any[]
  initialSitemapLogs: any[]
}

export default function AdminLogDashboard({
  initialPaymentLogs,
  initialTransactionLogs,
  initialSitemapLogs,
}: AdminLogDashboardProps) {
  const [activeTab, setActiveTab] = useState("payment")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // Implementasi refresh data sesuai tab aktif
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulasi loading

      toast({
        title: "Data diperbarui",
        description: "Log terbaru telah dimuat",
      })
    } catch (error) {
      toast({
        title: "Gagal memperbarui data",
        description: "Terjadi kesalahan saat memuat log terbaru",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async () => {
    // Implementasi export data sesuai tab aktif
    toast({
      title: "Mengekspor data",
      description: `Mengekspor log ${getTabName(activeTab)}`,
    })
  }

  const getTabName = (tab: string) => {
    switch (tab) {
      case "payment":
        return "Pembayaran"
      case "transaction":
        return "Transaksi"
      case "sitemap":
        return "Sitemap"
      case "auth":
        return "Autentikasi"
      case "access":
        return "Akses"
      default:
        return tab
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Log Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Monitoring</CardTitle>
          <CardDescription>Pantau semua aktivitas sistem dan deteksi masalah dengan cepat</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="payment" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="payment">Pembayaran</TabsTrigger>
              <TabsTrigger value="transaction">Transaksi</TabsTrigger>
              <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
              <TabsTrigger value="auth">Autentikasi</TabsTrigger>
              <TabsTrigger value="access">Akses</TabsTrigger>
            </TabsList>

            <TabsContent value="payment">
              <PaymentLogs initialLogs={initialPaymentLogs} />
            </TabsContent>

            <TabsContent value="transaction">
              <TransactionLogs initialLogs={initialTransactionLogs} />
            </TabsContent>

            <TabsContent value="sitemap">
              <SitemapLogs initialLogs={initialSitemapLogs} />
            </TabsContent>

            <TabsContent value="auth">
              <AuthLogs />
            </TabsContent>

            <TabsContent value="access">
              <AccessLogs />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
