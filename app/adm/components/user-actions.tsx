"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { MoreHorizontal, Edit, Trash, Shield, Eye, Ban, CheckCircle, Crown, UserMinus } from "lucide-react"

interface UserActionsProps {
  user: any
  onUserUpdated: () => void
}

export default function UserActions({ user, onUserUpdated }: UserActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleDeleteUser = async () => {
    setLoading(true)

    try {
      // Hapus pengguna dari database
      const { error } = await supabase.from("profiles").delete().eq("id", user.id)

      if (error) throw error

      toast({
        title: "Pengguna berhasil dihapus",
        description: `Pengguna ${user.username} telah dihapus dari sistem.`,
      })

      onUserUpdated()
    } catch (error: any) {
      toast({
        title: "Gagal menghapus pengguna",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const toggleUserStatus = async () => {
    setLoading(true)

    try {
      const newStatus = !user.is_active

      const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", user.id)

      if (error) throw error

      toast({
        title: `Pengguna berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`,
        description: `Status pengguna ${user.username} telah diperbarui.`,
      })

      onUserUpdated()
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui status pengguna",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsStatusDialogOpen(false)
    }
  }

  const updateUserRole = async (newRole: string) => {
    setLoading(true)

    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Role pengguna berhasil diperbarui",
        description: `Pengguna ${user.username} sekarang memiliki role ${newRole}.`,
      })

      onUserUpdated()
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui role pengguna",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRoleDialogOpen(false)
    }
  }

  const togglePremiumStatus = async () => {
    setLoading(true)

    try {
      const newStatus = !user.is_premium

      const { error } = await supabase.from("profiles").update({ is_premium: newStatus }).eq("id", user.id)

      if (error) throw error

      toast({
        title: `Status premium berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`,
        description: `Pengguna ${user.username} sekarang ${newStatus ? "memiliki" : "tidak memiliki"} akses premium.`,
      })

      onUserUpdated()
    } catch (error: any) {
      toast({
        title: "Gagal memperbarui status premium",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsPremiumDialogOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Buka menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href={`/${user.username}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Lihat Profil
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Edit className="h-4 w-4 mr-2" />
            Edit Pengguna
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}>
            {user.is_active ? (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Nonaktifkan
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aktifkan
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Ubah Role
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsPremiumDialogOpen(true)}>
            <Crown className="h-4 w-4 mr-2" />
            {user.is_premium ? "Hapus Premium" : "Jadikan Premium"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-red-600">
            <Trash className="h-4 w-4 mr-2" />
            Hapus Pengguna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog konfirmasi hapus pengguna */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong>{user.username}</strong>? Tindakan ini tidak dapat
              dibatalkan dan semua data pengguna akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog konfirmasi ubah status pengguna */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{user.is_active ? "Nonaktifkan Pengguna" : "Aktifkan Pengguna"}</AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_active
                ? `Apakah Anda yakin ingin menonaktifkan pengguna ${user.username}? Pengguna tidak akan dapat masuk ke akun mereka.`
                : `Apakah Anda yakin ingin mengaktifkan kembali pengguna ${user.username}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={toggleUserStatus} disabled={loading}>
              {loading ? "Memproses..." : user.is_active ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog ubah role pengguna */}
      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah Role Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Pilih role baru untuk pengguna <strong>{user.username}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-2 py-4">
            <Button
              variant={user.role === "user" ? "default" : "outline"}
              onClick={() => updateUserRole("user")}
              disabled={loading}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Pengguna Biasa
            </Button>
            <Button
              variant={user.role === "moderator" ? "default" : "outline"}
              onClick={() => updateUserRole("moderator")}
              disabled={loading}
            >
              <Shield className="h-4 w-4 mr-2" />
              Moderator
            </Button>
            <Button
              variant={user.role === "admin" ? "default" : "outline"}
              onClick={() => updateUserRole("admin")}
              disabled={loading}
              className={user.role === "admin" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog konfirmasi ubah status premium */}
      <AlertDialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{user.is_premium ? "Hapus Status Premium" : "Jadikan Premium"}</AlertDialogTitle>
            <AlertDialogDescription>
              {user.is_premium
                ? `Apakah Anda yakin ingin menghapus status premium dari pengguna ${user.username}?`
                : `Apakah Anda yakin ingin menjadikan ${user.username} sebagai pengguna premium?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={togglePremiumStatus}
              disabled={loading}
              className={user.is_premium ? "" : "bg-amber-600 hover:bg-amber-700"}
            >
              {loading ? "Memproses..." : user.is_premium ? "Hapus Premium" : "Jadikan Premium"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
