"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, BarChart3, Crown, RefreshCw, Users, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  email: string
  created_at: string
  is_premium?: boolean
}

interface AdminStatsProps {
  users: User[]
  onRefresh: () => void
  isLoading: boolean
}

export default function AdminStats({ users, onRefresh, isLoading }: AdminStatsProps) {
  // Hitung statistik pengguna
  const calculateStats = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const oneMonthAgo = new Date(now)
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    return {
      totalUsers: users.length,
      premiumUsers: users.filter((user) => user.is_premium).length,
      freeUsers: users.filter((user) => !user.is_premium).length,
      newUsersToday: users.filter((user) => new Date(user.created_at) >= today).length,
      newUsersThisWeek: users.filter((user) => new Date(user.created_at) >= oneWeekAgo).length,
      newUsersThisMonth: users.filter((user) => new Date(user.created_at) >= oneMonthAgo).length,
    }
  }

  const stats = calculateStats()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-white border-2 border-black shadow-[var(--shadow)]">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Pengguna</p>
              <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Activity className="h-3 w-3" />
              <span>Aktif</span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRefresh}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-2 border-black shadow-[var(--shadow)]">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pengguna Premium</p>
              <h3 className="text-2xl font-bold">{stats.premiumUsers}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers > 0
                  ? `${Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% dari total`
                  : "0% dari total"}
              </p>
            </div>
            <div className="bg-amber-100 p-2 rounded-full">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full"
                style={{ width: `${stats.totalUsers > 0 ? (stats.premiumUsers / stats.totalUsers) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-2 border-black shadow-[var(--shadow)]">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pengguna Free</p>
              <h3 className="text-2xl font-bold">{stats.freeUsers}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUsers > 0
                  ? `${Math.round((stats.freeUsers / stats.totalUsers) * 100)}% dari total`
                  : "0% dari total"}
              </p>
            </div>
            <div className="bg-gray-100 p-2 rounded-full">
              <UserX className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full"
                style={{ width: `${stats.totalUsers > 0 ? (stats.freeUsers / stats.totalUsers) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-2 border-black shadow-[var(--shadow)]">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pengguna Baru</p>
              <h3 className="text-2xl font-bold">{stats.newUsersThisMonth}</h3>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-green-600">{stats.newUsersToday}</span> hari ini
            </div>
            <div>
              <span className="font-medium text-blue-600">{stats.newUsersThisWeek}</span> minggu ini
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
