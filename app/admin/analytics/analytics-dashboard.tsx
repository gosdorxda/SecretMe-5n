"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
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
} from "recharts"
import { Users } from "lucide-react"

interface AnalyticsDashboardProps {
  userSignups: any[]
  messageActivity: any[]
  premiumTransactions: any[]
  premiumStats: {
    premiumUsers: number
    totalUsers: number
  }
  monthlyComparison: {
    currentMonth: number
    lastMonth: number
  }
  hourlyActivity: any[]
  trafficSources: {
    source: string
    count: number
  }[]
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
  // Proses data untuk grafik pendaftaran pengguna
  const userSignupData = processDateData(userSignups, "created_at")

  // Proses data untuk grafik aktivitas pesan
  const messageActivityData = processDateData(messageActivity, "created_at")

  // Proses data untuk grafik transaksi premium
  const premiumTransactionData = processDateData(premiumTransactions, "created_at")

  // Data untuk grafik pie sumber traffic
  const trafficSourceData = trafficSources.map((source) => ({
    name: source.source,
    value: source.count,
  }))

  // Warna untuk grafik pie
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  // Hitung persentase pertumbuhan bulanan
  const monthlyGrowth = monthlyComparison.lastMonth
    ? ((monthlyComparison.currentMonth - monthlyComparison.lastMonth) / monthlyComparison.lastMonth) * 100
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analitik</h1>
        <p className="text-muted-foreground">Analisis performa platform dan aktivitas pengguna.</p>
      </div>

      {/* Statistik Utama */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Premium</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {premiumStats.totalUsers > 0
                ? ((premiumStats.premiumUsers / premiumStats.totalUsers) * 100).toFixed(1)
                : "0"}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {premiumStats.premiumUsers} dari {premiumStats.totalUsers} pengguna
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pertumbuhan Bulanan</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyGrowth > 0 ? "+" : ""}
              {monthlyGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Dibandingkan bulan lalu ({monthlyComparison.lastMonth} pengguna)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Baru Bulan Ini</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyComparison.currentMonth}</div>
            <p className="text-xs text-muted-foreground">Pengguna baru bulan ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafik Utama */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Platform</CardTitle>
          <CardDescription>Aktivitas pengguna dalam 30 hari terakhir</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combineChartData(userSignupData, messageActivityData)}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip formatter={(value, name) => [value, name === "users" ? "Pendaftaran" : "Pesan"]} />
                <Legend />
                <Line type="monotone" dataKey="users" name="Pendaftaran" stroke="#0088FE" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="messages" name="Pesan" stroke="#00C49F" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grafik Tambahan */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Premium</CardTitle>
            <CardDescription>Transaksi premium dalam 30 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={premiumTransactionData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "Transaksi"]} />
                  <Bar dataKey="count" name="Transaksi" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sumber Traffic</CardTitle>
            <CardDescription>Distribusi sumber traffic pengguna</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {trafficSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Fungsi untuk memproses data berdasarkan tanggal
function processDateData(data: any[], dateField: string) {
  if (!data || data.length === 0) return []

  // Kelompokkan data berdasarkan tanggal
  const groupedData = data.reduce(
    (acc, item) => {
      const date = format(new Date(item[dateField]), "dd MMM", { locale: id })
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date]++
      return acc
    },
    {} as Record<string, number>,
  )

  // Konversi ke format yang dibutuhkan oleh Recharts
  return Object.entries(groupedData).map(([date, count]) => ({
    date,
    count,
  }))
}

// Fungsi untuk menggabungkan data dari dua sumber untuk grafik garis
function combineChartData(userData: any[], messageData: any[]) {
  // Buat set tanggal unik dari kedua sumber data
  const allDates = new Set([...userData.map((item) => item.date), ...messageData.map((item) => item.date)])

  // Buat objek untuk lookup cepat
  const userMap = userData.reduce(
    (acc, item) => {
      acc[item.date] = item.count
      return acc
    },
    {} as Record<string, number>,
  )

  const messageMap = messageData.reduce(
    (acc, item) => {
      acc[item.date] = item.count
      return acc
    },
    {} as Record<string, number>,
  )

  // Gabungkan data
  return Array.from(allDates).map((date) => ({
    date,
    users: userMap[date] || 0,
    messages: messageMap[date] || 0,
  }))
}
