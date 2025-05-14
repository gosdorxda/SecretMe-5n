"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, TrendingDown, Users, MessageSquare, Crown, Clock } from "lucide-react"

// Tipe data untuk props
interface AnalyticsDashboardProps {
  userSignups: { created_at: string }[]
  messageActivity: { created_at: string }[]
  premiumTransactions: { created_at: string; amount: number; status: string }[]
  premiumStats: {
    premiumUsers: number
    totalUsers: number
  }
  monthlyComparison: {
    currentMonth: number
    lastMonth: number
  }
  hourlyActivity: { created_at: string }[]
  trafficSources: { source: string; count: number }[]
}

export default function AnalyticsDashboard({
  userSignups,
  messageActivity,
  premiumTransactions,
  premiumStats,
  monthlyComparison,
  hourlyActivity,
  trafficSources,
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Persiapkan data untuk grafik pengguna per hari
  const userSignupData = prepareTimeSeriesData(userSignups, "created_at")

  // Persiapkan data untuk grafik pesan per hari
  const messageActivityData = prepareTimeSeriesData(messageActivity, "created_at")

  // Persiapkan data untuk grafik transaksi premium
  const premiumTransactionData = prepareTimeSeriesData(
    premiumTransactions.filter((t) => t.status === "success"),
    "created_at",
  )

  // Persiapkan data untuk grafik pie sumber traffic
  const trafficSourceData = trafficSources.map((source) => ({
    name: source.source,
    value: source.count,
  }))

  // Persiapkan data untuk peta panas aktivitas
  const heatmapData = prepareHeatmapData(hourlyActivity)

  // Hitung persentase perubahan pengguna bulan ini vs bulan lalu
  const monthlyChangePercent = monthlyComparison.lastMonth
    ? ((monthlyComparison.currentMonth - monthlyComparison.lastMonth) / monthlyComparison.lastMonth) * 100
    : 0

  // Warna untuk grafik
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Analitik</h1>
        <p className="text-muted-foreground">Analisis statistik pengguna dan aktivitas platform.</p>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="messages">Pesan</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Kartu Statistik */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Pengguna"
              value={premiumStats.totalUsers.toLocaleString()}
              trend={{
                value: monthlyChangePercent,
                label: "dari bulan lalu",
              }}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Pengguna Premium"
              value={`${premiumStats.premiumUsers.toLocaleString()} (${Math.round((premiumStats.premiumUsers / premiumStats.totalUsers) * 100) || 0}%)`}
              trend={{
                value: 5.2, // Contoh nilai
                label: "dari bulan lalu",
              }}
              icon={<Crown className="h-4 w-4" />}
            />
            <StatCard
              title="Pesan Bulan Ini"
              value={messageActivityData.length.toLocaleString()}
              trend={{
                value: 12.5, // Contoh nilai
                label: "dari bulan lalu",
              }}
              icon={<MessageSquare className="h-4 w-4" />}
            />
            <StatCard
              title="Waktu Aktif Rata-rata"
              value="8.2 menit"
              trend={{
                value: -2.1, // Contoh nilai negatif
                label: "dari bulan lalu",
              }}
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          {/* Grafik Utama */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pertumbuhan Pengguna</CardTitle>
                <CardDescription>Jumlah pendaftaran pengguna baru per hari (30 hari terakhir)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userSignupData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd MMM")} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [value, "Pengguna Baru"]}
                        labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy", { locale: id })}
                      />
                      <Area type="monotone" dataKey="count" stroke="#0088FE" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Pesan</CardTitle>
                <CardDescription>Jumlah pesan yang dikirim per hari (30 hari terakhir)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={messageActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd MMM")} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [value, "Pesan"]}
                        labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy", { locale: id })}
                      />
                      <Bar dataKey="count" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grafik Tambahan */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sumber Traffic</CardTitle>
                <CardDescription>Distribusi sumber traffic pengguna</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trafficSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {trafficSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Pengguna"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaksi Premium</CardTitle>
                <CardDescription>Jumlah transaksi premium berhasil per hari (30 hari terakhir)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={premiumTransactionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), "dd MMM")} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [value, "Transaksi"]}
                        labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy", { locale: id })}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#FFBB28"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Konten tab pengguna akan ditambahkan di sini */}
          <Card>
            <CardHeader>
              <CardTitle>Analisis Pengguna</CardTitle>
              <CardDescription>Detail statistik dan analisis pengguna</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tab ini akan berisi analisis mendalam tentang pengguna.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {/* Konten tab pesan akan ditambahkan di sini */}
          <Card>
            <CardHeader>
              <CardTitle>Analisis Pesan</CardTitle>
              <CardDescription>Detail statistik dan analisis pesan</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tab ini akan berisi analisis mendalam tentang aktivitas pesan.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          {/* Konten tab premium akan ditambahkan di sini */}
          <Card>
            <CardHeader>
              <CardTitle>Analisis Premium</CardTitle>
              <CardDescription>Detail statistik dan analisis pengguna premium</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tab ini akan berisi analisis mendalam tentang pengguna premium dan transaksi.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Komponen untuk kartu statistik
function StatCard({
  title,
  value,
  trend,
  icon,
}: {
  title: string
  value: string
  trend?: { value: number; label: string }
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            {trend.value > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
            )}
            <span className={trend.value > 0 ? "text-green-600" : "text-red-600"}>
              {trend.value > 0 ? "+" : ""}
              {trend.value.toFixed(1)}%
            </span>
            <span className="ml-1 text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Fungsi untuk mempersiapkan data time series
function prepareTimeSeriesData(data: any[], dateField: string) {
  // Buat objek untuk menyimpan jumlah per hari
  const countsByDay: Record<string, number> = {}

  // Hitung jumlah per hari
  data.forEach((item) => {
    const date = format(parseISO(item[dateField]), "yyyy-MM-dd")
    countsByDay[date] = (countsByDay[date] || 0) + 1
  })

  // Pastikan semua hari dalam rentang 30 hari terakhir ada
  const result = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = format(date, "yyyy-MM-dd")

    result.push({
      date: dateStr,
      count: countsByDay[dateStr] || 0,
    })
  }

  return result
}

// Fungsi untuk mempersiapkan data heatmap
function prepareHeatmapData(data: { created_at: string }[]) {
  // Buat array 2D untuk menyimpan jumlah aktivitas per jam per hari dalam seminggu
  const heatmapData = Array(7)
    .fill(0)
    .map(() => Array(24).fill(0))

  // Hitung jumlah aktivitas per jam per hari
  data.forEach((item) => {
    const date = parseISO(item.created_at)
    const dayOfWeek = date.getDay() // 0 = Minggu, 1 = Senin, dst.
    const hour = date.getHours()

    heatmapData[dayOfWeek][hour]++
  })

  return heatmapData
}
