"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AdminStats,
  AnalyticsDashboard,
  AuthMonitoring,
  IPSettings,
  NotificationSettings,
  PremiumManagement,
  SeoSettings as SEOSettings,
  SitemapSettings,
  UserCleanup,
  UsersManagement,
  RateLimitConfig,
  BlockedIPs,
} from "./components"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("stats")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <TabsTrigger value="stats">Statistik</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
          <TabsTrigger value="security">Keamanan</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          <AdminStats />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersManagement />
          <UserCleanup />
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          <PremiumManagement />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <AuthMonitoring />
          <IPSettings />
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <RateLimitConfig />
          <BlockedIPs />
          <SEOSettings />
          <SitemapSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
