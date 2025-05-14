"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { BarChart, LineChart } from "lucide-react"
import { ResponsiveBar } from "@nivo/bar"
import { ResponsiveLine } from "@nivo/line"
import { ResponsivePie } from "@nivo/pie"

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
    id: source.source,
    label: source.source,
    value: source.count,
  }))

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
            <LineChart className="h-4 w-4 text-muted-foreground" />
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
            <ResponsiveLine
              data={[
                {
                  id: "Pendaftaran",
                  data: userSignupData,
                },
                {
                  id: "Pesan",
                  data: messageActivityData,
                },
              ]}
              margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
              xScale={{ type: "point" }}
              yScale={{
                type: "linear",
                min: "auto",
                max: "auto",
                stacked: false,
                reverse: false,
              }}
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: "Tanggal",
                legendOffset: 45,
                legendPosition: "middle",
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Jumlah",
                legendOffset: -50,
                legendPosition: "middle",
              }}
              colors={{ scheme: "category10" }}
              pointSize={10}
              pointColor={{ theme: "background" }}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              pointLabelYOffset={-12}
              useMesh={true}
              legends={[
                {
                  anchor: "top-right",
                  direction: "row",
                  justify: false,
                  translateX: 0,
                  translateY: -20,
                  itemsSpacing: 0,
                  itemDirection: "left-to-right",
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: "circle",
                  symbolBorderColor: "rgba(0, 0, 0, .5)",
                },
              ]}
            />
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
              <ResponsiveBar
                data={premiumTransactionData.map((item) => ({
                  date: item.x,
                  jumlah: item.y,
                }))}
                keys={["jumlah"]}
                indexBy="date"
                margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                padding={0.3}
                valueScale={{ type: "linear" }}
                indexScale={{ type: "band", round: true }}
                colors={{ scheme: "nivo" }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: "Tanggal",
                  legendPosition: "middle",
                  legendOffset: 45,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Jumlah",
                  legendPosition: "middle",
                  legendOffset: -40,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
              />
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
              <ResponsivePie
                data={trafficSourceData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                colors={{ scheme: "nivo" }}
                borderWidth={1}
                borderColor={{
                  from: "color",
                  modifiers: [["darker", 0.2]],
                }}
                radialLabelsSkipAngle={10}
                radialLabelsTextColor="#333333"
                radialLabelsLinkColor={{ from: "color" }}
                sliceLabelsSkipAngle={10}
                sliceLabelsTextColor="#333333"
                legends={[
                  {
                    anchor: "bottom",
                    direction: "row",
                    translateY: 30,
                    itemWidth: 100,
                    itemHeight: 18,
                    itemTextColor: "#999",
                    symbolSize: 18,
                    symbolShape: "circle",
                  },
                ]}
              />
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
  const groupedData = data.reduce((acc, item) => {
    const date = format(new Date(item[dateField]), "dd MMM", { locale: id })
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date]++
    return acc
  }, {})

  // Konversi ke format yang dibutuhkan oleh Nivo
  return Object.entries(groupedData).map(([date, count]) => ({
    x: date,
    y: count,
  }))
}
