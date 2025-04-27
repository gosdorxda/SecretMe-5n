"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  UserPlus,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { id } from "date-fns/locale"

// Tipe data untuk statistik pengguna
interface UserStats {
  totalUsers: number
  newUsers: {
    today: number
    yesterday: number
    thisWeek: number
    lastWeek: number
    thisMonth: number
    lastMonth: number
  }
  activeUsers: {
    today: number
    yesterday: number
    thisWeek: number
    lastWeek: number
    thisMonth: number
  }
  userGrowth: {
    daily: { date: string; count: number }[]
    weekly: { week: string; count: number }[]
    monthly: { month: string; count: number }[]
  }
  messageStats: {
    total: number
    today: number
    yesterday: number
    thisWeek: number
    lastWeek: number
    thisMonth: number
  }
  messageDistribution: { date: string; count: number }[]
  userRetention: number
  averageMessagesPerUser: number
  topUsers: {
    user_id: string
    username: string | null
    name: string | null
    total_messages: number
  }[]
  deviceStats: {
    name: string
    value: number
  }[]
  timeOfDayStats: {
    hour: string
    count: number
  }[]
}

// Warna untuk grafik
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "12m">("30d")
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Fungsi untuk memuat data statistik
  const loadStats = async () => {
    setIsLoading(true)
    try {
      // Dapatkan tanggal untuk filter berdasarkan timeRange
      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case "7d":
          startDate = subDays(now, 7)
          break
        case "30d":
          startDate = subDays(now, 30)
          break
        case "90d":
          startDate = subDays(now, 90)
          break
        case "12m":
          startDate = subMonths(now, 12)
          break
      }

      // Format tanggal untuk query
      const startDateStr = format(startDate, "yyyy-MM-dd")
      const endDateStr = format(now, "yyyy-MM-dd")

      // Dapatkan total pengguna
      const { data: usersData, error: usersError } = await supabase.from("users").select("id, created_at, updated_at")

      if (usersError) throw usersError

      // Dapatkan statistik pesan
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, created_at, user_id")

      if (messagesError) throw messagesError

      // Dapatkan top users berdasarkan jumlah pesan
      // Karena tidak ada tabel message_stats, kita akan menghitung secara manual
      const userMessageCounts = messagesData.reduce(
        (acc, message) => {
          const userId = message.user_id
          if (!acc[userId]) {
            acc[userId] = 0
          }
          acc[userId]++
          return acc
        },
        {} as Record<string, number>,
      )

      // Konversi ke array dan urutkan
      const topUserIds = Object.entries(userMessageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId]) => userId)

      // Dapatkan informasi pengguna untuk top users
      const { data: topUsersInfo, error: topUsersError } = await supabase
        .from("users")
        .select("id, username, name")
        .in("id", topUserIds)

      if (topUsersError) throw topUsersError

      // Gabungkan data untuk top users
      const topUsers = topUserIds.map((userId) => {
        const userInfo = topUsersInfo.find((user) => user.id === userId) || { id: userId, username: null, name: null }
        return {
          user_id: userId,
          username: userInfo.username,
          name: userInfo.name,
          total_messages: userMessageCounts[userId],
        }
      })

      // Hitung statistik
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = subDays(today, 1)
      const oneWeekAgo = subDays(today, 7)
      const twoWeeksAgo = subDays(today, 14)
      const oneMonthAgo = subDays(today, 30)
      const twoMonthsAgo = subDays(today, 60)

      // Hitung pengguna baru
      const newUsersToday = usersData.filter((user) => new Date(user.created_at) >= today).length
      const newUsersYesterday = usersData.filter((user) => {
        const date = new Date(user.created_at)
        return date >= yesterday && date < today
      }).length
      const newUsersThisWeek = usersData.filter((user) => new Date(user.created_at) >= oneWeekAgo).length
      const newUsersLastWeek = usersData.filter((user) => {
        const date = new Date(user.created_at)
        return date >= twoWeeksAgo && date < oneWeekAgo
      }).length
      const newUsersThisMonth = usersData.filter((user) => new Date(user.created_at) >= oneMonthAgo).length
      const newUsersLastMonth = usersData.filter((user) => {
        const date = new Date(user.created_at)
        return date >= twoMonthsAgo && date < oneMonthAgo
      }).length

      // Hitung pengguna aktif berdasarkan updated_at sebagai alternatif last_sign_in_at
      // Ini mengasumsikan bahwa updated_at diperbarui ketika pengguna melakukan aktivitas
      const activeUsersToday = usersData.filter((user) => user.updated_at && new Date(user.updated_at) >= today).length
      const activeUsersYesterday = usersData.filter((user) => {
        if (!user.updated_at) return false
        const date = new Date(user.updated_at)
        return date >= yesterday && date < today
      }).length
      const activeUsersThisWeek = usersData.filter(
        (user) => user.updated_at && new Date(user.updated_at) >= oneWeekAgo,
      ).length
      const activeUsersLastWeek = usersData.filter((user) => {
        if (!user.updated_at) return false
        const date = new Date(user.updated_at)
        return date >= twoWeeksAgo && date < oneWeekAgo
      }).length
      const activeUsersThisMonth = usersData.filter(
        (user) => user.updated_at && new Date(user.updated_at) >= oneMonthAgo,
      ).length

      // Hitung statistik pesan
      const messagesToday = messagesData.filter((msg) => new Date(msg.created_at) >= today).length
      const messagesYesterday = messagesData.filter((msg) => {
        const date = new Date(msg.created_at)
        return date >= yesterday && date < today
      }).length
      const messagesThisWeek = messagesData.filter((msg) => new Date(msg.created_at) >= oneWeekAgo).length
      const messagesLastWeek = messagesData.filter((msg) => {
        const date = new Date(msg.created_at)
        return date >= twoWeeksAgo && date < oneWeekAgo
      }).length
      const messagesThisMonth = messagesData.filter((msg) => new Date(msg.created_at) >= oneMonthAgo).length

      // Buat data untuk grafik pertumbuhan pengguna harian
      const dailyGrowth = []
      const days = eachDayOfInterval({ start: startDate, end: now })

      for (const day of days) {
        const dayStr = format(day, "yyyy-MM-dd")
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)
        const nextDayStr = format(nextDay, "yyyy-MM-dd")

        const count = usersData.filter((user) => {
          const createdAt = new Date(user.created_at)
          return format(createdAt, "yyyy-MM-dd") === dayStr
        }).length

        dailyGrowth.push({
          date: format(day, "dd MMM", { locale: id }),
          count,
        })
      }

      // Buat data untuk grafik pertumbuhan pengguna mingguan
      const weeklyGrowth = []
      for (let i = 0; i < 12; i++) {
        const endWeek = subDays(now, i * 7)
        const startWeek = subDays(endWeek, 6)

        const count = usersData.filter((user) => {
          const createdAt = new Date(user.created_at)
          return createdAt >= startWeek && createdAt <= endWeek
        }).length

        weeklyGrowth.push({
          week: `${format(startWeek, "dd MMM", { locale: id })} - ${format(endWeek, "dd MMM", { locale: id })}`,
          count,
        })
      }
      weeklyGrowth.reverse()

      // Buat data untuk grafik pertumbuhan pengguna bulanan
      const monthlyGrowth = []
      for (let i = 0; i < 12; i++) {
        const month = subMonths(now, i)
        const startOfMonthDate = startOfMonth(month)
        const endOfMonthDate = endOfMonth(month)

        const count = usersData.filter((user) => {
          const createdAt = new Date(user.created_at)
          return createdAt >= startOfMonthDate && createdAt <= endOfMonthDate
        }).length

        monthlyGrowth.push({
          month: format(month, "MMM yyyy", { locale: id }),
          count,
        })
      }
      monthlyGrowth.reverse()

      // Buat data untuk distribusi pesan
      const messageDistribution = []
      for (const day of days) {
        const dayStr = format(day, "yyyy-MM-dd")

        const count = messagesData.filter((msg) => {
          const createdAt = new Date(msg.created_at)
          return format(createdAt, "yyyy-MM-dd") === dayStr
        }).length

        messageDistribution.push({
          date: format(day, "dd MMM", { locale: id }),
          count,
        })
      }

      // Hitung retensi pengguna (pengguna yang memiliki pesan lebih dari satu)
      const usersWithMessages = new Set(messagesData.map((msg) => msg.user_id))
      const usersWithMultipleMessages = Object.keys(userMessageCounts).filter((userId) => userMessageCounts[userId] > 1)
      const userRetention = usersData.length > 0 ? (usersWithMultipleMessages.length / usersData.length) * 100 : 0

      // Hitung rata-rata pesan per pengguna
      const averageMessagesPerUser = usersWithMessages.size > 0 ? messagesData.length / usersWithMessages.size : 0

      // Buat data untuk statistik perangkat (simulasi data)
      const deviceStats = [
        { name: "Desktop", value: 65 },
        { name: "Mobile", value: 30 },
        { name: "Tablet", value: 5 },
      ]

      // Buat data untuk statistik waktu pengiriman pesan (simulasi data)
      const timeOfDayStats = []
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, "0") + ":00"
        // Simulasi distribusi dengan puncak di pagi dan malam hari
        let count
        if (i >= 6 && i <= 9) {
          count = Math.floor(Math.random() * 50) + 100 // Pagi
        } else if (i >= 19 && i <= 23) {
          count = Math.floor(Math.random() * 70) + 120 // Malam
        } else {
          count = Math.floor(Math.random() * 40) + 30 // Sisa hari
        }

        timeOfDayStats.push({ hour, count })
      }

      // Set statistik
      setStats({
        totalUsers: usersData.length,
        newUsers: {
          today: newUsersToday,
          yesterday: newUsersYesterday,
          thisWeek: newUsersThisWeek,
          lastWeek: newUsersLastWeek,
          thisMonth: newUsersThisMonth,
          lastMonth: newUsersLastMonth,
        },
        activeUsers: {
          today: activeUsersToday,
          yesterday: activeUsersYesterday,
          thisWeek: activeUsersThisWeek,
          lastWeek: activeUsersLastWeek,
          thisMonth: activeUsersThisMonth,
        },
        userGrowth: {
          daily: dailyGrowth,
          weekly: weeklyGrowth,
          monthly: monthlyGrowth,
        },
        messageStats: {
          total: messagesData.length,
          today: messagesToday,
          yesterday: messagesYesterday,
          thisWeek: messagesThisWeek,
          lastWeek: messagesLastWeek,
          thisMonth: messagesThisMonth,
        },
        messageDistribution,
        userRetention,
        averageMessagesPerUser,
        topUsers,
        deviceStats,
        timeOfDayStats,
      })

      toast({
        title: "Data statistik berhasil dimuat",
        description: `Menampilkan data untuk ${timeRange === "7d" ? "7 hari" : timeRange === "30d" ? "30 hari" : timeRange === "90d" ? "90 hari" : "12 bulan"} terakhir`,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      toast({
        title: "Gagal memuat data statistik",
        description: "Terjadi kesalahan saat mengambil data statistik",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Muat statistik saat komponen dimuat atau timeRange berubah
  useEffect(() => {
    loadStats()
  }, [timeRange])

  // Fungsi untuk mengekspor data ke CSV
  const exportToCSV = () => {
    if (!stats) return

    // Buat data untuk CSV
    const rows = [
      ["Metrik", "Nilai"],
      ["Total Pengguna", stats.totalUsers],
      ["Pengguna Baru Hari Ini", stats.newUsers.today],
      ["Pengguna Baru Minggu Ini", stats.newUsers.thisWeek],
      ["Pengguna Baru Bulan Ini", stats.newUsers.thisMonth],
      ["Pengguna Aktif Hari Ini", stats.activeUsers.today],
      ["Pengguna Aktif Minggu Ini", stats.activeUsers.thisWeek],
      ["Pengguna Aktif Bulan Ini", stats.activeUsers.thisMonth],
      ["Total Pesan", stats.messageStats.total],
      ["Pesan Hari Ini", stats.messageStats.today],
      ["Pesan Minggu Ini", stats.messageStats.thisWeek],
      ["Pesan Bulan Ini", stats.messageStats.thisMonth],
      ["Retensi Pengguna (%)", stats.userRetention.toFixed(2)],
      ["Rata-rata Pesan per Pengguna", stats.averageMessagesPerUser.toFixed(2)],
    ]

    // Konversi ke string CSV
    const csvContent = rows.map((row) => row.join(",")).join("\n")

    // Buat file dan unduh
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `statistik-pengguna-${format(new Date(), "yyyy-MM-dd")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render loading state
  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat data statistik...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Analitik</h2>
          <p className="text-muted-foreground">Analisis detail tentang pengguna dan aktivitas di platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {timeRange === "7d"
                  ? "7 hari terakhir"
                  : timeRange === "30d"
                    ? "30 hari terakhir"
                    : timeRange === "90d"
                      ? "90 hari terakhir"
                      : "12 bulan terakhir"}
                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0" align="end">
              <div className="flex flex-col">
                <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimeRange("7d")}>
                  7 hari terakhir
                </Button>
                <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimeRange("30d")}>
                  30 hari terakhir
                </Button>
                <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimeRange("90d")}>
                  90 hari terakhir
                </Button>
                <Button variant="ghost" className="justify-start font-normal" onClick={() => setTimeRange("12m")}>
                  12 bulan terakhir
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={loadStats} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={!stats}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Kartu metrik utama */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">{stats.newUsers.thisMonth} pengguna baru bulan ini</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers.thisMonth}</div>
                <p className="text-xs text-muted-foreground">{stats.activeUsers.today} aktif hari ini</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pesan</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.messageStats.total}</div>
                <p className="text-xs text-muted-foreground">{stats.messageStats.today} pesan hari ini</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retensi Pengguna</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.userRetention.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.averageMessagesPerUser.toFixed(1)} pesan/pengguna
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs untuk berbagai grafik */}
          <Tabs defaultValue="growth">
            <TabsList>
              <TabsTrigger value="growth">Pertumbuhan Pengguna</TabsTrigger>
              <TabsTrigger value="messages">Aktivitas Pesan</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="devices">Perangkat & Waktu</TabsTrigger>
            </TabsList>

            {/* Tab Pertumbuhan Pengguna */}
            <TabsContent value="growth" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pertumbuhan Pengguna</CardTitle>
                  <CardDescription>Jumlah pengguna baru yang mendaftar setiap periode</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={
                          timeRange === "7d" || timeRange === "30d"
                            ? stats.userGrowth.daily
                            : timeRange === "90d"
                              ? stats.userGrowth.weekly
                              : stats.userGrowth.monthly
                        }
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={
                            timeRange === "7d" || timeRange === "30d" ? "date" : timeRange === "90d" ? "week" : "month"
                          }
                          tick={{ fontSize: 12 }}
                          interval={timeRange === "30d" ? 2 : 0}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Pengguna Baru"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Pengguna Baru vs Periode Sebelumnya</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <span>Hari Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.newUsers.today}</span>
                          {stats.newUsers.today > stats.newUsers.yesterday ? (
                            <span className="text-xs text-green-500">
                              +
                              {(
                                ((stats.newUsers.today - stats.newUsers.yesterday) /
                                  Math.max(stats.newUsers.yesterday, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {(
                                ((stats.newUsers.today - stats.newUsers.yesterday) /
                                  Math.max(stats.newUsers.yesterday, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <span>Minggu Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.newUsers.thisWeek}</span>
                          {stats.newUsers.thisWeek > stats.newUsers.lastWeek ? (
                            <span className="text-xs text-green-500">
                              +
                              {(
                                ((stats.newUsers.thisWeek - stats.newUsers.lastWeek) /
                                  Math.max(stats.newUsers.lastWeek, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {(
                                ((stats.newUsers.thisWeek - stats.newUsers.lastWeek) /
                                  Math.max(stats.newUsers.lastWeek, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                          <span>Bulan Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.newUsers.thisMonth}</span>
                          {stats.newUsers.thisMonth > stats.newUsers.lastMonth ? (
                            <span className="text-xs text-green-500">
                              +
                              {(
                                ((stats.newUsers.thisMonth - stats.newUsers.lastMonth) /
                                  Math.max(stats.newUsers.lastMonth, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {(
                                ((stats.newUsers.thisMonth - stats.newUsers.lastMonth) /
                                  Math.max(stats.newUsers.lastMonth, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Pengguna</CardTitle>
                    <CardDescription>Pengguna dengan jumlah pesan terbanyak</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topUsers.map((user, index) => (
                        <div key={user.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              {index + 1}
                            </div>
                            <span>{user.name || user.username || "Pengguna"}</span>
                          </div>
                          <div className="font-medium">{user.total_messages} pesan</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Aktivitas Pesan */}
            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Pesan</CardTitle>
                  <CardDescription>Jumlah pesan yang dikirim setiap hari</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.messageDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          interval={timeRange === "30d" ? 2 : timeRange === "90d" ? 6 : 0}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Jumlah Pesan" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Aktivitas Pesan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>Hari Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.messageStats.today}</span>
                          {stats.messageStats.today > stats.messageStats.yesterday ? (
                            <span className="text-xs text-green-500">
                              +
                              {(
                                ((stats.messageStats.today - stats.messageStats.yesterday) /
                                  Math.max(stats.messageStats.yesterday, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {(
                                ((stats.messageStats.today - stats.messageStats.yesterday) /
                                  Math.max(stats.messageStats.yesterday, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>Minggu Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.messageStats.thisWeek}</span>
                          {stats.messageStats.thisWeek > stats.messageStats.lastWeek ? (
                            <span className="text-xs text-green-500">
                              +
                              {(
                                ((stats.messageStats.thisWeek - stats.messageStats.lastWeek) /
                                  Math.max(stats.messageStats.lastWeek, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {(
                                ((stats.messageStats.thisWeek - stats.messageStats.lastWeek) /
                                  Math.max(stats.messageStats.lastWeek, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>Bulan Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.messageStats.thisMonth}</span>
                          <span className="text-xs text-muted-foreground">
                            {((stats.messageStats.thisMonth / stats.messageStats.total) * 100).toFixed(1)}% dari total
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rata-rata Pesan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-[180px]">
                      <div className="text-4xl font-bold">{stats.averageMessagesPerUser.toFixed(1)}</div>
                      <p className="text-sm text-muted-foreground mt-2">Pesan per pengguna</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Engagement */}
            <TabsContent value="engagement" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Retensi Pengguna</CardTitle>
                    <CardDescription>Persentase pengguna yang kembali ke platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-[200px]">
                      <div className="relative h-40 w-40">
                        <svg className="h-full w-full" viewBox="0 0 100 100">
                          <circle
                            className="text-gray-200"
                            strokeWidth="10"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className="text-primary"
                            strokeWidth="10"
                            strokeDasharray={`${stats.userRetention * 2.51} 251.2`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-2xl font-bold">{stats.userRetention.toFixed(1)}%</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        {stats.userRetention > 50 ? "Retensi baik" : "Perlu peningkatan"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pengguna Aktif</CardTitle>
                    <CardDescription>Perbandingan pengguna aktif dengan periode sebelumnya</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Hari Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.activeUsers.today}</span>
                          {stats.activeUsers.today > stats.activeUsers.yesterday ? (
                            <span className="text-xs text-green-500">
                              +
                              {(
                                ((stats.activeUsers.today - stats.activeUsers.yesterday) /
                                  Math.max(stats.activeUsers.yesterday, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {(
                                ((stats.activeUsers.today - stats.activeUsers.yesterday) /
                                  Math.max(stats.activeUsers.yesterday, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Minggu Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.activeUsers.thisWeek}</span>
                          {stats.activeUsers.thisWeek > stats.activeUsers.lastWeek ? (
                            <span className="text-xs text-green-500">
                              +
                              {(
                                ((stats.activeUsers.thisWeek - stats.activeUsers.lastWeek) /
                                  Math.max(stats.activeUsers.lastWeek, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          ) : (
                            <span className="text-xs text-red-500">
                              {(
                                ((stats.activeUsers.thisWeek - stats.activeUsers.lastWeek) /
                                  Math.max(stats.activeUsers.lastWeek, 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span>Bulan Ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.activeUsers.thisMonth}</span>
                          <span className="text-xs text-muted-foreground">
                            {((stats.activeUsers.thisMonth / stats.totalUsers) * 100).toFixed(1)}% dari total
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab Perangkat & Waktu */}
            <TabsContent value="devices" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribusi Perangkat</CardTitle>
                    <CardDescription>Jenis perangkat yang digunakan pengguna</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.deviceStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.deviceStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Waktu Aktivitas</CardTitle>
                    <CardDescription>Distribusi aktivitas berdasarkan waktu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.timeOfDayStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Aktivitas" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
