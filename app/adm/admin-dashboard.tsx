"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminHeader from "./components/admin-header"
import UsersList from "./components/users-list"

interface AdminDashboardProps {
  userId: string
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <div className="container mx-auto py-6 space-y-8">
      <AdminHeader userId={userId} />

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="messages">Pesan</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          <TabsTrigger value="logs">Log Sistem</TabsTrigger>
          <TabsTrigger value="premium">Premium</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersList />
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium">Manajemen Pesan</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Fitur ini akan segera tersedia. Anda akan dapat mengelola pesan antar pengguna.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium">Laporan & Statistik</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Fitur ini akan segera tersedia. Anda akan dapat melihat laporan dan statistik platform.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium">Pengaturan Platform</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Fitur ini akan segera tersedia. Anda akan dapat mengonfigurasi pengaturan platform.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium">Log Sistem</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Fitur ini akan segera tersedia. Anda akan dapat melihat log aktivitas sistem.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-medium">Manajemen Premium</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Fitur ini akan segera tersedia. Anda akan dapat mengelola pengguna premium dan transaksi.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
