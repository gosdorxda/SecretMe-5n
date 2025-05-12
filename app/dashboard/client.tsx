"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"
import { FileText, Link2, User, ImageIcon, Trash2 } from "lucide-react"
import { DashboardHeader } from "./components/dashboard-header"
import { PremiumBanner } from "./components/premium-banner"
import { ProfileQuickView } from "./components/profile-quick-view"
import { StatisticsCards } from "./components/statistics-cards"
import { DashboardTabs } from "./components/dashboard-tabs"
import { useAuth } from "@/components/auth-provider"

type UserType = Database["public"]["Tables"]["users"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

interface DashboardClientProps {
  user: UserType
  messages: Message[]
  viewCount: number
}

// Ubah dari export default menjadi export function untuk mengatasi error
export function DashboardClient({ user, messages, viewCount }: DashboardClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("messages")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "replied" | "unreplied">("all")
  const supabase = createClient()
  const { toast } = useToast()
  const [allowPublicReplies, setAllowPublicReplies] = useState(user.allow_public_replies || false)
  const { signOut } = useAuth() // Gunakan signOut dari AuthProvider

  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ["messages", "profile", "settings"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Modifikasi fungsi handleTabChange untuk memperbarui URL tanpa parameter transaksi jika sudah berhasil
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard?tab=${value}`, { scroll: false })
  }

  // Perbaiki fungsi handleLogout untuk menggunakan signOut dari AuthProvider
  async function handleLogout() {
    setIsLoading(true)
    try {
      await signOut() // Gunakan signOut dari AuthProvider
      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari akun",
      })
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari akun, tetapi terjadi error di background",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setIsLoading(true)
    try {
      // Delete user data from database
      const { error: deleteError } = await supabase.from("users").delete().eq("id", user.id)

      if (deleteError) {
        throw deleteError
      }

      // Sign out menggunakan signOut dari AuthProvider
      await signOut()

      toast({
        title: "Akun berhasil dihapus",
        description: "Semua data Anda telah dihapus dari sistem kami",
      })
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "Gagal menghapus akun",
        description: error.message || "Terjadi kesalahan saat menghapus akun",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  function copyProfileLink() {
    const profileUrl = `${window.location.origin}/${user.is_premium && user.username ? user.username : user.numeric_id}`
    navigator.clipboard.writeText(profileUrl)
    toast({
      title: "Link disalin",
      description: "Link profil Anda telah disalin ke clipboard",
    })
  }

  function handleReplySuccess() {
    router.refresh()
  }

  function handleDeleteSuccess() {
    router.refresh()
  }

  // Calculate stats
  const totalMessages = messages.length
  const repliedMessages = messages.filter((m) => m.reply).length
  const unrepliedMessages = totalMessages - repliedMessages
  const replyRate = totalMessages > 0 ? Math.round((repliedMessages / totalMessages) * 100) : 0

  // Filter messages based on search and filter status
  const filteredMessages = messages.filter((message) => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "replied") return matchesSearch && !!message.reply
    if (filterStatus === "unreplied") return matchesSearch && !message.reply

    return matchesSearch
  })

  // Count active social media links
  const socialMediaCount = [
    user.instagram_url,
    user.facebook_url,
    user.linkedin_url,
    user.twitter_url,
    user.tiktok_url,
  ].filter(Boolean).length

  // Generate premium features list with status
  const premiumFeatures = [
    {
      title: "Username Kustom",
      description: "Pilih username unik untuk link profil Anda",
      icon: <User className="h-5 w-5 text-purple-500" />,
      status: {
        label: user.is_premium ? (user.username ? "Aktif" : "Belum diatur") : "Tidak Aktif",
        variant: user.is_premium ? (user.username ? "success" : "info") : "inactive",
      },
    },
    {
      title: "Ubah Nama",
      description: "Ubah nama tampilan profil Anda kapan saja",
      icon: <User className="h-5 w-5 text-red-500" />,
      status: {
        label: user.is_premium ? "Aktif" : "Tidak Aktif",
        variant: user.is_premium ? "success" : "inactive",
      },
    },
    {
      title: "Foto Profil",
      description: "Unggah foto profil Anda sendiri",
      icon: <ImageIcon className="h-5 w-5 text-blue-500" />,
      status: {
        label: user.is_premium ? (user.avatar_url ? "Aktif" : "Belum diatur") : "Tidak Aktif",
        variant: user.is_premium ? (user.avatar_url ? "success" : "info") : "inactive",
      },
    },
    {
      title: "Bio Profil",
      description: "Tambahkan deskripsi singkat tentang diri Anda",
      icon: <FileText className="h-5 w-5 text-green-500" />,
      status: {
        label: user.is_premium ? (user.bio ? "Aktif" : "Belum diatur") : "Tidak Aktif",
        variant: user.is_premium ? (user.bio ? "success" : "info") : "inactive",
      },
    },
    {
      title: "Link Sosial Media",
      description: "Tambahkan link Instagram, Facebook, LinkedIn, dan TikTok",
      icon: <Link2 className="h-5 w-5 text-pink-500" />,
      status: {
        label: user.is_premium ? (socialMediaCount > 0 ? `${socialMediaCount} Aktif` : "Belum diatur") : "Tidak Aktif",
        variant: user.is_premium ? (socialMediaCount > 0 ? "success" : "info") : "inactive",
      },
    },
    {
      title: "Hapus Pesan",
      description: "Hapus pesan yang tidak diinginkan",
      icon: <Trash2 className="h-5 w-5 text-red-500" />,
      status: {
        label: user.is_premium ? "Aktif" : "Tidak Aktif",
        variant: user.is_premium ? "success" : "inactive",
      },
    },
  ]

  return (
    <div className="w-full max-w-[56rem] mx-auto px-4 sm:px-6">
      <DashboardHeader user={user} onLogout={handleLogout} />
      <ProfileQuickView user={user} />
      <PremiumBanner user={user} />
      <StatisticsCards messages={messages} viewCount={viewCount} />
      <DashboardTabs
        user={user}
        messages={messages}
        viewCount={viewCount}
        onDeleteAccount={handleDeleteAccount}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        isLoading={isLoading}
      />
    </div>
  )
}
