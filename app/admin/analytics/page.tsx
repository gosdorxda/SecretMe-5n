import { createClient } from "@/lib/supabase/server"
import AnalyticsDashboard from "./analytics-dashboard"
import { formatISO, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const supabase = createClient()
  const today = new Date()

  // Tanggal untuk filter
  const last30Days = formatISO(subDays(today, 30))
  const last90Days = formatISO(subDays(today, 90))

  // Tanggal untuk bulan ini
  const currentMonthStart = formatISO(startOfMonth(today))
  const currentMonthEnd = formatISO(endOfMonth(today))

  // Tanggal untuk bulan lalu
  const lastMonthStart = formatISO(startOfMonth(subMonths(today, 1)))
  const lastMonthEnd = formatISO(endOfMonth(subMonths(today, 1)))

  // Ambil data pengguna per hari (30 hari terakhir)
  const { data: userSignups } = await supabase
    .from("users")
    .select("created_at")
    .gte("created_at", last30Days)
    .order("created_at", { ascending: true })

  // Ambil data pesan per hari (30 hari terakhir)
  const { data: messageActivity } = await supabase
    .from("messages")
    .select("created_at")
    .gte("created_at", last30Days)
    .order("created_at", { ascending: true })

  // Ambil data transaksi premium (30 hari terakhir)
  const { data: premiumTransactions } = await supabase
    .from("premium_transactions")
    .select("created_at, amount, status")
    .gte("created_at", last30Days)
    .order("created_at", { ascending: true })

  // Ambil statistik pengguna berdasarkan status premium - PERBAIKAN SYNTAX COUNT
  const { count: premiumUsersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true)

  const { count: totalUsersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

  // Ambil statistik pengguna bulan ini vs bulan lalu - PERBAIKAN SYNTAX COUNT
  const { count: currentMonthUsersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", currentMonthStart)
    .lte("created_at", currentMonthEnd)

  const { count: lastMonthUsersCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", lastMonthStart)
    .lte("created_at", lastMonthEnd)

  // Ambil data untuk peta panas aktivitas
  const { data: hourlyActivity } = await supabase
    .from("messages")
    .select("created_at")
    .gte("created_at", last90Days)
    .order("created_at", { ascending: true })

  // Ambil data untuk sumber traffic (simulasi - dalam implementasi nyata ini bisa dari tabel terpisah)
  const trafficSources = [
    { source: "Direct", count: 450 },
    { source: "Social Media", count: 320 },
    { source: "Search", count: 280 },
    { source: "Referral", count: 190 },
    { source: "Other", count: 60 },
  ]

  return (
    <AnalyticsDashboard
      userSignups={userSignups || []}
      messageActivity={messageActivity || []}
      premiumTransactions={premiumTransactions || []}
      premiumStats={{
        premiumUsers: premiumUsersCount || 0,
        totalUsers: totalUsersCount || 0,
      }}
      monthlyComparison={{
        currentMonth: currentMonthUsersCount || 0,
        lastMonth: lastMonthUsersCount || 0,
      }}
      hourlyActivity={hourlyActivity || []}
      trafficSources={trafficSources}
    />
  )
}
