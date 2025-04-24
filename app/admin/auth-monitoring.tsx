"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Download, RefreshCw, Trash2 } from "lucide-react"
import {
  getAuthStats,
  getAuthStatsSummary,
  clearAuthStats,
  exportAuthStats,
  exportAuthStatsCSV,
} from "@/lib/auth-monitor"
import type { AuthRequestStats, AuthStatsSummary } from "@/lib/auth-monitor"

export default function AuthMonitoring() {
  const [summary, setSummary] = useState<AuthStatsSummary | null>(null)
  const [stats, setStats] = useState<AuthRequestStats[]>([])
  const [activeTab, setActiveTab] = useState("summary")
  const [refreshKey, setRefreshKey] = useState(0)
  const [warnings, setWarnings] = useState<
    {
      type: string
      current: number
      limit: number
      ratio: number
    }[]
  >([])

  // Fungsi untuk memformat waktu
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Fungsi untuk memformat durasi
  const formatDuration = (ms: number) => {
    return `${ms.toFixed(2)}ms`
  }

  // Fungsi untuk memuat data
  const loadData = () => {
    const allStats = getAuthStats()
    const summaryData = getAuthStatsSummary()

    setStats(allStats)
    setSummary(summaryData)
  }

  // Fungsi untuk menghapus data
  const handleClearStats = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua data monitoring?")) {
      clearAuthStats()
      setRefreshKey((prev) => prev + 1)
    }
  }

  // Fungsi untuk mengekspor data
  const handleExportJSON = () => {
    const jsonData = exportAuthStats()
    const blob = new Blob([jsonData], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `auth-stats-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Fungsi untuk mengekspor data CSV
  const handleExportCSV = () => {
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
  }

  // Efek untuk memuat data saat komponen dimuat
  useEffect(() => {
    loadData()

    // Setup interval untuk memperbarui data secara berkala
    const interval = setInterval(loadData, 30000) // Perbarui setiap 30 detik

    // Setup listener untuk peringatan rate limit
    const handleRateLimitWarning = (event: CustomEvent) => {
      setWarnings((prev) => {
        // Cek apakah peringatan sudah ada
        const existingIndex = prev.findIndex((w) => w.type === event.detail.type)

        if (existingIndex >= 0) {
          // Update peringatan yang sudah ada
          const newWarnings = [...prev]
          newWarnings[existingIndex] = event.detail
          return newWarnings
        } else {
          // Tambahkan peringatan baru
          return [...prev, event.detail]
        }
      })
    }

    window.addEventListener("auth-rate-limit-warning", handleRateLimitWarning as EventListener)

    return () => {
      clearInterval(interval)
      window.removeEventListener("auth-rate-limit-warning", handleRateLimitWarning as EventListener)
    }
  }, [refreshKey])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monitoring Autentikasi</span>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((prev) => prev + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Pantau dan analisis permintaan autentikasi untuk mencegah rate limit</CardDescription>
      </CardHeader>

      <CardContent>
        {warnings.length > 0 && (
          <div className="mb-4 space-y-2">
            {warnings.map((warning, index) => (
              <Alert variant="destructive" key={index}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Peringatan Rate Limit</AlertTitle>
                <AlertDescription>
                  {warning.type === "minute" &&
                    `${warning.current}/${warning.limit} permintaan dalam 1 menit terakhir (${Math.round(warning.ratio * 100)}%)`}
                  {warning.type === "hour" &&
                    `${warning.current}/${warning.limit} permintaan dalam 1 jam terakhir (${Math.round(warning.ratio * 100)}%)`}
                  {warning.type === "day" &&
                    `${warning.current}/${warning.limit} permintaan dalam 1 hari terakhir (${Math.round(warning.ratio * 100)}%)`}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Ringkasan</TabsTrigger>
            <TabsTrigger value="recent">Permintaan Terbaru</TabsTrigger>
            <TabsTrigger value="charts">Grafik</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            {summary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Permintaan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.totalRequests}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Berhasil: {summary.successfulRequests} | Gagal: {summary.failedRequests}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Permintaan Cache</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.cachedRequests}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {summary.totalRequests > 0
                        ? `${Math.round((summary.cachedRequests / summary.totalRequests) * 100)}% dari total permintaan`
                        : "Tidak ada data"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Durasi Rata-rata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatDuration(summary.averageDuration)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Waktu respons rata-rata</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">5 Menit Terakhir</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.requestsLast5Min}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.round(summary.requestsLast5Min / 5)} permintaan/menit
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">1 Jam Terakhir</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.requestsLast1Hour}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.round(summary.requestsLast1Hour / 60)} permintaan/menit
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">24 Jam Terakhir</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary.requestsLast24Hours}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {Math.round(summary.requestsLast24Hours / 24)} permintaan/jam
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">Tidak ada data monitoring</div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            <div className="border rounded-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 text-left">Waktu</th>
                      <th className="px-4 py-2 text-left">Endpoint</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Durasi</th>
                      <th className="px-4 py-2 text-left">Sumber</th>
                      <th className="px-4 py-2 text-left">Cache</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.length > 0 ? (
                      // Tampilkan 50 permintaan terbaru
                      [...stats]
                        .reverse()
                        .slice(0, 50)
                        .map((stat, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                            <td className="px-4 py-2">{formatTime(stat.timestamp)}</td>
                            <td className="px-4 py-2">{stat.endpoint}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${stat.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                              >
                                {stat.success ? "Berhasil" : "Gagal"}
                              </span>
                            </td>
                            <td className="px-4 py-2">{formatDuration(stat.duration)}</td>
                            <td className="px-4 py-2">{stat.source}</td>
                            <td className="px-4 py-2">
                              {stat.cached ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Cache</span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Live</span>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          Tidak ada data permintaan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charts">
            <div className="text-center py-8">
              <p>Grafik visualisasi akan ditampilkan di sini.</p>
              <p className="text-muted-foreground">
                Untuk implementasi lengkap, tambahkan library chart seperti Chart.js atau Recharts.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>
          <Button variant="outline" onClick={handleClearStats} className="mr-2">
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus Data
          </Button>
        </div>
        <div>
          <Button variant="outline" onClick={handleExportCSV} className="mr-2">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
