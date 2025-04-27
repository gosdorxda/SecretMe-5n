"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Crown, Globe, FileText } from "lucide-react"

// Import komponen dari folder components
import RateLimitConfig from "./components/rate-limit-config"
import BlockedIPs from "./components/blocked-ips"
import SeoSettings from "./components/seo-settings"
import SitemapSettings from "./components/sitemap-settings"
import AuthMonitoring from "./components/auth-monitoring"
import NotificationSettings from "./components/notification-settings"
import { UserCleanup } from "./components/user-cleanup"
import UsersManagement from "./components/users-management"
import PremiumManagement from "./components/premium-management"
import AdminStats from "./components/admin-stats"

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
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="rate-limit">Rate Limit</TabsTrigger>
          <TabsTrigger value="blocked-ips">IP Diblokir</TabsTrigger>
          <TabsTrigger value="seo">
            <Globe className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="sitemap">
            <FileText className="h-4 w-4 mr-2" />
            Sitemap
          </TabsTrigger>
          <TabsTrigger value="auth-monitoring">Auth Monitoring</TabsTrigger>
          <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
          <TabsTrigger value="user-cleanup">User Cleanup</TabsTrigger>
          <TabsTrigger value="premium">
            <Crown className="h-4 w-4 mr-2" />
            Premium
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersManagement initialUsers={initialUsers} />
        </TabsContent>

        <TabsContent value="rate-limit">
          <RateLimitConfig />
        </TabsContent>

        <TabsContent value="blocked-ips">
          <BlockedIPs />
        </TabsContent>

        <TabsContent value="seo">
          <SeoSettings />
        </TabsContent>

        <TabsContent value="sitemap">
          <SitemapSettings />
        </TabsContent>

        <TabsContent value="auth-monitoring">
          <AuthMonitoring />
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
      </Tabs>
    </div>
  )
}
