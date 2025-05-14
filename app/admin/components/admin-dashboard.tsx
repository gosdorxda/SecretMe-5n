"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Users, MessageSquare, Crown, TrendingUp, Shield, Bell } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string | null
  email: string
  username: string | null
  created_at: string
  is_premium?: boolean
}

interface AdminDashboardProps {
  stats: {
    userCount: number
    premiumCount: number
    messageCount: number
    premiumPercentage: number
  }
  recentUsers: User[]
}

export default function AdminDashboard({ stats, recentUsers }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground">Selamat datang di panel admin SecretMe.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Pengguna"
          value={stats.userCount.toLocaleString()}
          description="Pengguna terdaftar"
          icon={<Users className="h-5 w-5 text-blue-600" />}
          linkHref="/admin/users"
          linkText="Kelola pengguna"
        />
        <StatsCard
          title="Pengguna Premium"
          value={stats.premiumCount.toLocaleString()}
          description={`${stats.premiumPercentage}% dari total pengguna`}
          icon={<Crown className="h-5 w-5 text-amber-500" />}
          linkHref="/admin/premium"
          linkText="Kelola premium"
        />
        <StatsCard
          title="Total Pesan"
          value={stats.messageCount.toLocaleString()}
          description="Pesan terkirim"
          icon={<MessageSquare className="h-5 w-5 text-green-600" />}
        />
        <StatsCard
          title="Konversi Premium"
          value={`${stats.premiumPercentage}%`}
          description={`${stats.premiumCount} dari ${stats.userCount} pengguna`}
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pengguna Terbaru</CardTitle>
            <CardDescription>5 pengguna yang baru mendaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || (user.username ? `@${user.username}` : "Tanpa nama")}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{format(new Date(user.created_at), "dd MMM yyyy", { locale: id })}</TableCell>
                    <TableCell>
                      {user.is_premium ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300">
                          Premium
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                          Free
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
                Lihat semua pengguna →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Akses Cepat</CardTitle>
            <CardDescription>Pintasan ke fitur admin yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickAccessLink
              href="/admin/users"
              title="Manajemen Pengguna"
              description="Kelola pengguna, atur status premium, dan hapus akun"
              icon={<Users className="h-5 w-5 text-blue-600" />}
            />
            <QuickAccessLink
              href="/admin/premium"
              title="Pengaturan Premium"
              description="Kelola fitur premium dan lihat transaksi"
              icon={<Crown className="h-5 w-5 text-amber-500" />}
            />
            <QuickAccessLink
              href="/admin/security"
              title="Keamanan"
              description="Atur rate limit dan kelola IP yang diblokir"
              icon={<Shield className="h-5 w-5 text-green-600" />}
            />
            <QuickAccessLink
              href="/admin/notifications"
              title="Notifikasi"
              description="Kelola notifikasi sistem dan lihat log pengiriman"
              icon={<Bell className="h-5 w-5 text-purple-600" />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon,
  linkHref,
  linkText,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  linkHref?: string
  linkText?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {linkHref && linkText && (
          <div className="mt-3">
            <Link href={linkHref} className="text-xs text-blue-600 hover:underline">
              {linkText} →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickAccessLink({
  href,
  title,
  description,
  icon,
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href} className="block">
      <div className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
        <div className="mt-0.5">{icon}</div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  )
}
