"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
// Tambahkan import untuk Home icon
import { Users, CreditCard, Settings, Shield, AlertTriangle, BarChart, Bell, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Import komponen dari folder components
import {
  AdminStats,
  AuthLogs,
  AuthMonitoring,
  IPSettings,
  NotificationLogs,
  NotificationSettings,
  PremiumManagement,
  SeoSettings,
  UserCleanup,
  UsersManagement,
} from "./components"

// type User = Database["public"]["Tables"]["users"]["Row"]
interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  username: string | null
  name: string | null
  avatar_url: string | null
  is_premium?: boolean
  premium_expires_at?: string | null
}

interface AdminDashboardProps {
  initialUsers: User[]
}

export default function AdminDashboard({ initialUsers }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Refresh data pengguna
  const refreshUsers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setUsers(data || [])
      toast({
        title: "Data berhasil diperbarui",
        description: `${data?.length || 0} pengguna ditemukan`,
      })
    } catch (error) {
      console.error("Error refreshing users:", error)
      toast({
        title: "Gagal memperbarui data",
        description: "Terjadi kesalahan saat mengambil data pengguna",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Komponen statistik admin */}
      <AdminStats users={users} onRefresh={refreshUsers} isLoading={isLoading} />

      <Tabs defaultValue="rumah">
        {/* Tambahkan tab "Rumah" di TabsList */}
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="rumah" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Rumah</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="premium" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Premium</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Monitoring</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifikasi</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Tambahkan TabsContent untuk tab "Rumah" */}
        <TabsContent value="rumah" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rumah Monitoring</CardTitle>
              <CardDescription>Dashboard monitoring autentikasi dan keamanan aplikasi SecretMe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  Halaman Rumah Monitoring menyediakan dashboard lengkap untuk memantau aktivitas autentikasi dan
                  keamanan aplikasi.
                </p>
                <div className="flex justify-center">
                  <Button asChild>
                    <a href="/admin/rumah">Buka Rumah Monitoring</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement initialUsers={initialUsers} />
        </TabsContent>

        <TabsContent value="ip-settings">
          <IPSettings />
        </TabsContent>

        <TabsContent value="seo">
          <SeoSettings />
        </TabsContent>

        <TabsContent value="auth-monitoring">
          <AuthMonitoring />
        </TabsContent>

        <TabsContent value="auth-logs">
          <AuthLogs />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="user-cleanup">
          <UserCleanup />
        </TabsContent>

        <TabsContent value="premium">
          <PremiumManagement />
        </TabsContent>

        <TabsContent value="notification-logs">
          <NotificationLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
