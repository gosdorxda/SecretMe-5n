"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UsersList from "./components/users-list"
import AdminHeader from "./components/admin-header"

interface AdminDashboardProps {
  userId: string
}

export default function AdminDashboard({ userId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AdminHeader userId={userId} />

      <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="users">Pengguna</TabsTrigger>
          <TabsTrigger value="messages">Pesan</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          <TabsTrigger value="logs">Log Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Pengguna</CardTitle>
              <CardDescription>Kelola semua pengguna yang terdaftar di platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Pesan</CardTitle>
              <CardDescription>Kelola pesan yang dikirim antar pengguna.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Komponen manajemen pesan akan ditampilkan di sini.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Laporan</CardTitle>
              <CardDescription>Lihat laporan dan statistik platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Komponen laporan akan ditampilkan di sini.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan</CardTitle>
              <CardDescription>Konfigurasi pengaturan platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Komponen pengaturan akan ditampilkan di sini.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Sistem</CardTitle>
              <CardDescription>Lihat log aktivitas sistem.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Komponen log sistem akan ditampilkan di sini.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
