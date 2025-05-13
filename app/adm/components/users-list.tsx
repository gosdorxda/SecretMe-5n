"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserPlus, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import UserActions from "./user-actions"
import UserRoleBadge from "./user-role-badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const usersPerPage = 10

  const supabase = createClientComponentClient()

  const fetchUsers = async () => {
    setLoading(true)

    // Hitung total pengguna untuk pagination
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .ilike("email", `%${searchQuery}%`)

    setTotalUsers(count || 0)
    setTotalPages(Math.ceil((count || 0) / usersPerPage))

    // Ambil data pengguna dengan pagination
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        username,
        name,
        email,
        created_at,
        is_premium,
        role,
        avatar_url
      `)
      .ilike("email", `%${searchQuery}%`)
      .order("created_at", { ascending: false })
      .range((currentPage - 1) * usersPerPage, currentPage * usersPerPage - 1)

    if (error) {
      console.error("Error fetching users:", error)
    } else {
      setUsers(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset ke halaman pertama saat pencarian
    fetchUsers()
  }

  const handleRefresh = () => {
    fetchUsers()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="search"
            placeholder="Cari email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tanggal Daftar</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Premium</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 7 }).map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Tidak ada pengguna yang ditemukan
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username || "-"}</TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <UserRoleBadge role={user.role || "user"} />
                  </TableCell>
                  <TableCell>{user.is_premium ? "Ya" : "Tidak"}</TableCell>
                  <TableCell className="text-right">
                    <UserActions user={user} onUserUpdated={fetchUsers} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {users.length} dari {totalUsers} pengguna
        </p>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
