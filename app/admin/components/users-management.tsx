"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, UserCheck, UserX, Calendar, RefreshCw, Trash2, AlertTriangle, Crown, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Definisikan interface User
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
  numeric_id: number
  message_count?: number
}

interface UsersManagementProps {
  initialUsers: User[]
  totalUsers: number
}

export default function UsersManagement({ initialUsers, totalUsers }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sortField, setSortField] = useState<keyof User>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterPremium, setFilterPremium] = useState<boolean | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [toggleAction, setToggleAction] = useState<"add" | "remove">("add")
  const [isSearching, setIsSearching] = useState(false)
  const [filteredTotal, setFilteredTotal] = useState(totalUsers)

  // State untuk dialog hapus akun
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  // Hitung total halaman berdasarkan jumlah pengguna
  useEffect(() => {
    setTotalPages(Math.ceil(filteredTotal / itemsPerPage))
  }, [filteredTotal, itemsPerPage])

  // Load users dengan pagination
  const loadUsers = async (page: number, perPage: number, search = searchTerm, premiumFilter = filterPremium) => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("users")
        .select("*", { count: "exact" })
        .order(sortField, { ascending: sortDirection === "asc" })

      // Apply premium filter if set
      if (premiumFilter !== null) {
        query = query.eq("is_premium", premiumFilter)
      }

      // Apply search filter if set
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`)
      }

      // Get total count for pagination
      const { count } = await query.select("*", { count: "exact", head: true })
      setFilteredTotal(count || 0)

      // Get paginated data
      const from = (page - 1) * perPage
      const to = from + perPage - 1
      const { data: usersData, error } = await query.range(from, to)

      if (error) throw error

      // Get message counts for each user
      const usersWithMessageCount = await Promise.all(
        (usersData || []).map(async (user) => {
          const { count: messageCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)

          return {
            ...user,
            message_count: messageCount || 0,
          }
        }),
      )

      setUsers(usersWithMessageCount)
    } catch (error: any) {
      console.error("Error loading users:", error)
      toast({
        title: "Gagal memuat data",
        description: error.message || "Terjadi kesalahan saat mengambil data pengguna",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load users when page, itemsPerPage, or filters change
  useEffect(() => {
    loadUsers(currentPage, itemsPerPage)
  }, [currentPage, itemsPerPage, sortField, sortDirection])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1) // Reset to first page on new search
      loadUsers(1, itemsPerPage, searchTerm, filterPremium)
      setIsSearching(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, filterPremium])

  // Handle perubahan halaman
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle perubahan jumlah item per halaman
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = Number.parseInt(value)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset ke halaman pertama saat mengubah jumlah item per halaman
  }

  // Refresh data pengguna
  const refreshUsers = async () => {
    loadUsers(currentPage, itemsPerPage)
  }

  // Fungsi untuk membuka dialog konfirmasi toggle premium
  const openToggleDialog = (user: User, action: "add" | "remove") => {
    setUserToToggle(user)
    setToggleAction(action)
    setIsToggleDialogOpen(true)
  }

  // Fungsi untuk membuka dialog konfirmasi hapus akun
  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  // Toggle status premium pengguna
  const togglePremiumStatus = async () => {
    if (!userToToggle) return

    setIsToggling(true)
    try {
      // Set tanggal kedaluwarsa 100 tahun dari sekarang untuk premium selamanya
      const foreverDate = new Date()
      foreverDate.setFullYear(foreverDate.getFullYear() + 100)

      const { error } = await supabase
        .from("users")
        .update({
          is_premium: toggleAction === "add",
          premium_expires_at: toggleAction === "add" ? foreverDate.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userToToggle.id)

      if (error) throw error

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userToToggle.id
            ? {
                ...user,
                is_premium: toggleAction === "add",
                premium_expires_at: toggleAction === "add" ? foreverDate.toISOString() : null,
              }
            : user,
        ),
      )

      toast({
        title: "Status premium diperbarui",
        description: `Pengguna ${userToToggle.name} sekarang ${toggleAction === "add" ? "premium" : "tidak premium"}`,
      })
    } catch (error: any) {
      console.error("Error toggling premium status:", error)
      toast({
        title: "Gagal memperbarui status",
        description: error.message || "Terjadi kesalahan saat memperbarui status premium",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
      setIsToggleDialogOpen(false)
      setUserToToggle(null)
    }
  }

  // Hapus akun pengguna
  const deleteUserAccount = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      // Memanggil API untuk menghapus pengguna
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal menghapus pengguna")
      }

      // Update state lokal
      setUsers(users.filter((user) => user.id !== userToDelete.id))
      setFilteredTotal((prev) => prev - 1)

      toast({
        title: "Akun berhasil dihapus",
        description: `Akun ${userToDelete.name} telah dihapus dari sistem`,
      })
    } catch (error: any) {
      console.error("Error deleting user account:", error)
      toast({
        title: "Gagal menghapus akun",
        description: error.message || "Terjadi kesalahan saat menghapus akun pengguna",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  // Export data pengguna ke CSV
  const exportToCSV = () => {
    setIsLoading(true)

    // Fungsi untuk mengekspor semua data
    const exportAllData = async () => {
      try {
        let query = supabase
          .from("users")
          .select("*")
          .order(sortField, { ascending: sortDirection === "asc" })

        // Apply premium filter if set
        if (filterPremium !== null) {
          query = query.eq("is_premium", filterPremium)
        }

        // Apply search filter if set
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        }

        const { data, error } = await query

        if (error) throw error

        // Get message counts for export
        const usersWithMessageCount = await Promise.all(
          (data || []).map(async (user) => {
            const { count: messageCount } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)

            return {
              ...user,
              message_count: messageCount || 0,
            }
          }),
        )

        const headers = [
          "ID",
          "Nama",
          "Username",
          "Email",
          "ID Profil",
          "Total Pesan",
          "Tanggal Daftar",
          "Premium",
          "Premium Berakhir",
        ]

        const csvData = usersWithMessageCount.map((user) => [
          user.id,
          user.name || "-",
          user.username || "-",
          user.email,
          user.username || user.numeric_id,
          user.message_count || 0,
          format(new Date(user.created_at), "dd MMMM yyyy HH:mm", { locale: id }),
          user.is_premium ? "Ya" : "Tidak",
          user.premium_expires_at ? format(new Date(user.premium_expires_at), "dd MMMM yyyy", { locale: id }) : "-",
        ])

        const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
          "\n",
        )

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `users-${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Export Berhasil",
          description: `${usersWithMessageCount?.length || 0} data pengguna berhasil diekspor ke CSV`,
        })
      } catch (error: any) {
        console.error("Error exporting users:", error)
        toast({
          title: "Gagal mengekspor data",
          description: error.message || "Terjadi kesalahan saat mengekspor data pengguna",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    exportAllData()
  }

  // Handle sort
  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Reset filter
  const resetFilters = () => {
    setSearchTerm("")
    setFilterPremium(null)
    setCurrentPage(1)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Pengguna</CardTitle>
              <CardDescription>Kelola semua pengguna yang terdaftar di platform</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshUsers}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "Memuat..." : "Refresh"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setIsSearching(true)
                  }}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Filter Premium:</span>
                <Button
                  variant={filterPremium === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPremium(null)}
                  className="text-xs"
                >
                  Semua
                </Button>
                <Button
                  variant={filterPremium === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPremium(true)}
                  className="text-xs"
                >
                  Premium
                </Button>
                <Button
                  variant={filterPremium === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPremium(false)}
                  className="text-xs"
                >
                  Free
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500 mt-0.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div className="text-sm text-amber-800">
                <p className="font-medium">Kelola Status Premium dan Akun Pengguna</p>
                <p className="text-xs mt-1">
                  Anda dapat mengubah status premium pengguna atau menghapus akun pengguna dengan mengklik tombol pada
                  kolom Aksi.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[250px]">Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ID Profil</TableHead>
                  <TableHead>Total Pesan</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Skeleton loading
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-28" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterPremium !== null ? (
                        <>
                          Tidak ada pengguna yang cocok dengan filter yang dipilih
                          <div className="mt-2">
                            <Button variant="outline" size="sm" onClick={resetFilters}>
                              Reset Filter
                            </Button>
                          </div>
                        </>
                      ) : (
                        "Tidak ada data pengguna"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name || "Tidak diatur"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.username ? (
                          <span className="text-blue-600">@{user.username}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Tidak diatur</span>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <a
                          href={`/${user.username || user.numeric_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline font-mono text-sm"
                        >
                          {user.username || user.numeric_id}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-400"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span className="text-sm font-medium">{user.message_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(user.created_at), "dd MMM yyyy", { locale: id })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.is_premium ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300">
                              <Crown className="h-3 w-3 mr-1 text-amber-500" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                              Free
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={user.is_premium ? "destructive" : "default"}
                            size="sm"
                            onClick={() => openToggleDialog(user, user.is_premium ? "remove" : "add")}
                            className="h-8 text-xs flex items-center gap-1"
                          >
                            {user.is_premium ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>Hapus Premium</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Jadikan Premium</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            className="h-8 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && filteredTotal > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Menampilkan</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder={itemsPerPage.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">dari {filteredTotal} pengguna</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Halaman pertama</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Halaman sebelumnya</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </Button>

            {/* Render nomor halaman */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Tampilkan halaman saat ini, halaman pertama, halaman terakhir, dan 1 halaman di sekitar halaman saat ini
                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
              })
              .map((page, index, array) => {
                // Tambahkan ellipsis jika ada halaman yang dilewati
                const prevPage = array[index - 1]
                const showEllipsisBefore = prevPage && page - prevPage > 1

                return (
                  <React.Fragment key={page}>
                    {showEllipsisBefore && (
                      <span className="flex h-8 w-8 items-center justify-center text-sm">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                )
              })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Halaman berikutnya</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Halaman terakhir</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Dialog konfirmasi toggle premium */}
      <AlertDialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleAction === "add" ? "Jadikan Premium" : "Hapus Status Premium"}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleAction === "add" ? (
                <>
                  Apakah Anda yakin ingin menjadikan <strong>{userToToggle?.name}</strong> sebagai pengguna premium?
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                    Pengguna akan mendapatkan akses ke semua fitur premium selamanya.
                  </div>
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus status premium dari <strong>{userToToggle?.name}</strong>?
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs">
                    Pengguna akan kehilangan akses ke semua fitur premium.
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={togglePremiumStatus}
              disabled={isToggling}
              className={toggleAction === "add" ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              {isToggling ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : toggleAction === "add" ? (
                "Jadikan Premium"
              ) : (
                "Hapus Premium"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog konfirmasi hapus akun */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex items-start gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p>
                    Apakah Anda yakin ingin menghapus akun <strong>{userToDelete?.name}</strong>?
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Tindakan ini akan menghapus semua data pengguna secara permanen dan tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-md border border-red-200 text-sm text-red-800">
                <div className="font-medium">Peringatan:</div>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                  <li>Semua pesan yang diterima pengguna akan dihapus</li>
                  <li>Profil pengguna tidak akan dapat diakses lagi</li>
                  <li>Pengguna harus mendaftar ulang jika ingin menggunakan layanan kembali</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUserAccount}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menghapus...
                </>
              ) : (
                "Hapus Akun"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
