"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Bell, Crown, Globe, Shield, Users, Key, Trash2, FileText, Server, Clock } from "lucide-react"

// Import komponen langsung dari file mereka, bukan dari index
import AdminStats from "@/app/admin/components/admin-stats"
import AuthMonitoring from "@/app/admin/components/auth-monitoring"
import IPSettings from "@/app/admin/components/ip-settings"
import NotificationLogs from "@/app/admin/components/notification-logs"
import NotificationSettings from "@/app/admin/components/notification-settings"
import NotificationQueueMonitor from "@/app/admin/components/notification-queue-monitor"
import PremiumManagement from "@/app/admin/components/premium-management"
import SeoSettings from "@/app/admin/components/seo-settings"
import UserCleanup from "@/app/admin/components/user-cleanup"
import UsersManagement from "@/app/admin/components/users-management"
// Impor komponen CronJobManager
import { CronJobManager } from "./components/cron-job-manager"

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

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Pengguna
          </TabsTrigger>
          <TabsTrigger value="ip-settings">
            <Shield className="h-4 w-4 mr-2" />
            Pengaturan IP
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="auth-monitoring">
            <Key className="h-4 w-4 mr-2" />
            Auth Monitoring
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="queue-monitor">
            <Server className="h-4 w-4 mr-2" />
            Antrian Notifikasi
          </TabsTrigger>
          <TabsTrigger value="user-cleanup">
            <Trash2 className="h-4 w-4 mr-2" />
            User Cleanup
          </TabsTrigger>
          <TabsTrigger value="premium">
            <Crown className="h-4 w-4 mr-2" />
            Premium
          </TabsTrigger>
          <TabsTrigger value="notification-logs">
            <FileText className="h-4 w-4 mr-2" />
            Log Notifikasi
          </TabsTrigger>
          <TabsTrigger value="cron-jobs">
            <Clock className="h-4 w-4 mr-2" />
            Cron Jobs
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        {/* Tambahkan tab baru untuk monitor antrian */}
        <TabsContent value="queue-monitor">
          <NotificationQueueMonitor />
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
        <TabsContent value="cron-jobs">
          <CronJobManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
