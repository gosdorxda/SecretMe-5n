"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download, AlertTriangle, Home, Users, Shield, Clock } from "lucide-react"
import { getAuthStatsSummary, exportAuthStatsCSV } from "@/lib/auth-monitor"
import AuthActivityChart from "./components/auth-activity-chart"
import AuthSessionsTable from "./components/auth-sessions-table"
import AuthErrorsPanel from "./components/auth-errors-panel"
import DeviceBreakdown from "./components/device-breakdown"
import RealTimeMonitor from "./components/real-time-monitor"
import { useToast } from "@/hooks/use-toast"

interface RumahDashboardProps {
  userId: string
}

export default function RumahDashboard({ userId }: RumahDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const { toast } = useToast()

  // Fungsi untuk memuat data
  const loadData = async () => {
    setIsLoading(true)
    try {
      const summaryData = getAuthStatsSummary()
      setSummary(summaryData)
    } catch (error) {
      console.error("Error loading auth data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data monitoring autentikasi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk mengekspor data
  const handleExportCSV = () => {
    try {
      const csvData = exportAuthStatsCSV()
      const blob = new Blob([csvData], { type: "text/csv" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `auth-stats-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Berhasil",
        description: "Data monitoring berhasil diekspor ke CSV",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "Gagal mengekspor data monitoring",
        variant: "destructive",
      })
    }
  }

  // Efek untuk memuat data saat komponen dimuat
  useEffect(() => {
    loadData()

    // Setup interval untuk memperbarui data secara berkala (setiap 30 detik)
    const interval = setInterval(loadData, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [refreshKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rumah Monitoring</h1>
          <p className="text-muted-foreground">Dashboard monitoring autentikasi dan keamanan aplikasi SecretMe</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Memuat..." : "Refresh"}</span>
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Alert jika ada masalah */}
      {summary && summary.failedRequests > 10 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Peringatan: Tingkat Kegagalan Tinggi</h3>
            <p className="text-sm text-red-700 mt-1">
              Terdeteksi {summary.failedRequests} permintaan autentikasi yang gagal. Periksa log untuk detail lebih
              lanjut.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Sesi</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Error</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Perangkat</span>
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Real-time</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatisticCard
                title="Total Permintaan"
                value={summary?.totalRequests || 0}
                description={`Berhasil: ${summary?.successfulRequests || 0} | Gagal: ${summary?.failedRequests || 0}`}
                icon={<Shield className="h-5 w-5 text-blue-500" />}
              />
              <StatisticCard
                title="Permintaan Cache"
                value={summary?.cachedRequests || 0}
                description={
                  summary?.totalRequests > 0
                    ? `${Math.round((summary.cachedRequests / summary.totalRequests) * 100)}% dari total`
                    : "Tidak ada data"
                }
                icon={<Clock className="h-5 w-5 text-green-500" />}
              />
              <StatisticCard
                title="Durasi Rata-rata"
                value={summary?.averageDuration ? `${summary.averageDuration.toFixed(2)}ms` : "0ms"}
                description="Waktu respons rata-rata"
                icon={<RefreshCw className="h-5 w-5 text-purple-500" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Autentikasi</CardTitle>
                <CardDescription>Grafik aktivitas autentikasi dalam 24 jam terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <AuthActivityChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sesi Autentikasi</CardTitle>
                <CardDescription>Daftar sesi autentikasi terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <AuthSessionsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Autentikasi</CardTitle>
                <CardDescription>Daftar error autentikasi terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <AuthErrorsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Breakdown Perangkat</CardTitle>
                <CardDescription>Distribusi autentikasi berdasarkan perangkat</CardDescription>
              </CardHeader>
              <CardContent>
                <DeviceBreakdown />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monitoring Real-time</CardTitle>
                <CardDescription>Pantau aktivitas autentikasi secara real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <RealTimeMonitor />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// Komponen StatisticCard
function StatisticCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
