"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase/database.types"
import { MessageList } from "@/components/message-list"
import {
  Crown,
  Copy,
  Instagram,
  Facebook,
  Linkedin,
  FileText,
  Link2,
  MessageSquare,
  User,
  Share2,
  InstagramIcon as BrandTiktok,
  ImageIcon,
  Trash2,
  LogOut,
  Settings,
  AlertTriangle,
  Lock,
  CheckCircle,
} from "lucide-react"
import { UsernameForm } from "@/components/username-form"
import { SocialMediaForm } from "@/components/social-media-form"
import { AvatarUpload } from "@/components/avatar-upload"
import { BioForm } from "@/components/bio-form"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
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

// Tambahkan import ProfilePreview
import { ProfilePreview } from "@/components/profile-preview"

// Tambahkan import NameForm
import { NameForm } from "@/components/name-form"

// Tambahkan import untuk PublicRepliesToggle
import { PublicRepliesToggle } from "@/components/public-replies-toggle"

type UserType = Database["public"]["Tables"]["users"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

interface DashboardClientProps {
  user: UserType
  messages: Message[]
}

// Ubah dari export default menjadi export function untuk mengatasi error
export function DashboardClient({ user, messages }: DashboardClientProps) {
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
  const [viewCount, setViewCount] = useState(0)
  const [allowPublicReplies, setAllowPublicReplies] = useState(user.allow_public_replies || false)
  const hasTransaction = searchParams.has("order_id")

  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ["messages", "profile", "settings"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard?tab=${value}`, { scroll: false })
  }

  // Fetch view count data
  useEffect(() => {
    const fetchViewCount = async () => {
      try {
        // Ambil data tayangan dari tabel profile_views
        const { data, error } = await supabase.from("profile_views").select("count").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching view count:", error)
          return
        }

        // Jika data ditemukan, gunakan nilai count
        // Jika tidak, gunakan nilai default 0
        setViewCount(data?.count || 0)
      } catch (error) {
        console.error("Error fetching view count:", error)
      }
    }

    fetchViewCount()
  }, [supabase, user.id])

  async function handleLogout() {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Logout gagal",
        description: error.message || "Terjadi kesalahan saat logout",
        variant: "destructive",
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

      // Sign out
      await supabase.auth.signOut()

      toast({
        title: "Akun berhasil dihapus",
        description: "Semua data Anda telah dihapus dari sistem kami",
      })

      router.push("/")
      router.refresh()
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
      {/* Header Section with Greeting and Quick Stats */}
      <div className="mt-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Halo, <span className="text-gradient">{user.name}</span>! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Selamat datang kembali di dashboard Anda</p>
          </div>

          <div className="flex items-center gap-2">
            {!user.is_premium && (
              <Button asChild variant="warning" size="sm" className="neo-btn gap-1 animate-pulse">
                <Link href="/premium">
                  <Crown className="h-4 w-4 mr-1" />
                  <span>Upgrade ke Premium</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tampilkan status transaksi jika ada */}
      {hasTransaction && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
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
              className="text-amber-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Status Transaksi
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Transaksi Anda sedang diproses. Silakan cek status pembayaran Anda.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => {
              // Implementasi pengecekan status transaksi
              const orderId = searchParams.get("order_id")
              if (orderId) {
                fetch(`/api/payment/check-status?order_id=${orderId}`)
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.success) {
                      toast({
                        title: "Status Pembayaran",
                        description: data.message || "Status pembayaran berhasil diperbarui",
                      })
                      router.refresh()
                    } else {
                      toast({
                        title: "Gagal Memeriksa Status",
                        description: data.message || "Terjadi kesalahan saat memeriksa status pembayaran",
                        variant: "destructive",
                      })
                    }
                  })
                  .catch((error) => {
                    toast({
                      title: "Gagal Memeriksa Status",
                      description: "Terjadi kesalahan saat memeriksa status pembayaran",
                      variant: "destructive",
                    })
                  })
              }
            }}
          >
            Cek Status Pembayaran
          </Button>
        </div>
      )}

      {/* Profile Quick View and Share */}
      <div className="mb-8">
        <Card className="neo-card overflow-hidden border-2 border-[var(--border)]">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Profile Info */}
              <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-200">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-[var(--border)]">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-[var(--main)] to-amber-400 text-white text-2xl">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{user.name}</h2>
                      {user.is_premium && (
                        <Badge className="bg-[rgb(250,204,21)] text-black border border-amber-500 rounded-[var(--border-radius)] text-[10px] font-normal">
                          <Crown className="h-2.5 w-2.5 mr-1" />
                          <span>Premium</span>
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username || user.numeric_id}</p>
                    {!user.is_premium && (
                      <p className="text-xs text-amber-500 italic mt-1">Upgrade ke Premium untuk ganti username</p>
                    )}

                    {/* Bio section - show for premium users or locked for free users */}
                    {user.is_premium && user.bio ? (
                      <p className="text-sm mt-2 line-clamp-2">{user.bio}</p>
                    ) : (
                      <div className="mt-2 flex items-center gap-1.5 text-muted-foreground/70">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <p className="text-xs italic line-clamp-1">
                          {user.is_premium ? "Tambahkan bio Anda..." : "Bio (fitur premium)"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="mt-4 flex gap-2">
                  {user.is_premium && socialMediaCount > 0 ? (
                    <>
                      {user.instagram_url && (
                        <a
                          href={user.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white border-2 border-[var(--border)] transition-all"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                      )}
                      {user.facebook_url && (
                        <a
                          href={user.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white border-2 border-[var(--border)] transition-all"
                        >
                          <Facebook className="h-4 w-4" />
                        </a>
                      )}
                      {user.linkedin_url && (
                        <a
                          href={user.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-700 text-white border-2 border-[var(--border)] transition-all"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {user.tiktok_url && (
                        <a
                          href={user.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white border-2 border-[var(--border)] transition-all"
                        >
                          <span className="font-bold text-sm">T</span>
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 border-2 border-[var(--border)] opacity-50">
                        <Instagram className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 border-2 border-[var(--border)] opacity-50">
                        <Facebook className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 border-2 border-[var(--border)] opacity-50">
                        <Linkedin className="h-4 w-4 text-gray-400" />
                      </div>
                      {!user.is_premium && (
                        <div className="flex items-center ml-1">
                          <span className="text-xs text-muted-foreground italic">(Fitur premium)</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Share Profile */}
              <div className="bg-gradient-to-br from-[var(--bg)] to-gray-100 md:w-1/3">
                <h3 className="font-medium text-sm mb-3 flex items-center gap-2 p-4 pb-0">
                  <Share2 className="h-4 w-4 text-gray-600" />
                  <span>Bagikan Profil Anda</span>
                </h3>

                <div className="bg-white p-3 rounded-md border-2 border-[var(--border)] mb-3 mx-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Link profil:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 truncate">
                      {window.location.origin}/{user.is_premium && user.username ? user.username : user.numeric_id}
                    </code>
                  </div>
                </div>

                <div className="flex gap-2 mx-4 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyProfileLink}
                    className="flex-1 neo-btn-outline text-xs h-9"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Salin Link
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 neo-btn text-xs h-9"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Kirim pesan anonim ke saya",
                          text: "Kirim pesan anonim ke saya melalui SecretMe",
                          url: `${window.location.origin}/${
                            user.is_premium && user.username ? user.username : user.numeric_id
                          }`,
                        })
                      } else {
                        copyProfileLink()
                      }
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1.5" />
                    Bagikan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistik Section */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pesan</p>
                <p className="text-xl font-bold">{totalMessages}</p>
              </div>
            </div>
          </Card>

          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dibalas</p>
                <p className="text-xl font-bold">{repliedMessages}</p>
              </div>
            </div>
          </Card>

          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Belum Dibalas</p>
                <p className="text-xl font-bold">{unrepliedMessages}</p>
              </div>
            </div>
          </Card>

          <Card className="neo-card border-2 border-[var(--border)] py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tayangan</p>
                <p className="text-xl font-bold">{viewCount}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Cari bagian TabsList dan TabsTrigger */}
        <TabsList className="grid w-full grid-cols-3 mb-6 p-0.5 h-10 gap-1">
          <TabsTrigger value="messages" className="rounded-md text-xs">
            <span>Pesan</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-md text-xs">
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-md text-xs">
            <span>Pengaturan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <Card className="neo-card">
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Pesan Anonim</CardTitle>
                </div>
              </div>

              {/* Ubah elemen div dengan class "flex items-center justify-between bg-orange-50/80 rounded-lg p-4 border border-orange-200"
              menjadi ukuran yang lebih normal */}

              <div className="mb-3">
                <div className="flex items-center justify-between bg-orange-50/80 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-orange-700">Balasan Publik</span>
                        <Badge
                          variant={allowPublicReplies ? "success" : "secondary"}
                          className={
                            allowPublicReplies
                              ? "bg-green-100 text-green-800 border-green-200 text-xs px-1.5 py-0"
                              : "bg-gray-100 text-gray-800 border-gray-200 text-xs px-1.5 py-0"
                          }
                        >
                          {allowPublicReplies ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <p className="text-xs text-orange-600">
                        {allowPublicReplies
                          ? "Pengunjung dapat membalas pesan Anda"
                          : "Hanya Anda yang dapat membalas pesan"}
                      </p>
                    </div>
                  </div>
                  <PublicRepliesToggle
                    userId={user.id}
                    initialValue={allowPublicReplies}
                    minimal={true}
                    onToggleChange={(checked) => setAllowPublicReplies(checked)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <Input
                    placeholder="Cari pesan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-gray-200 h-10 text-sm"
                  />
                </div>

                <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                  <Button
                    variant={filterStatus === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("all")}
                    className={`h-10 px-3 text-xs flex-1 sm:flex-none !transition-none !transform-none ${
                      filterStatus === "all"
                        ? "bg-[var(--main)] text-white border-2 border-black shadow-none hover:bg-[var(--main)] hover:text-white hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                        : "bg-white text-gray-700 border-2 border-black shadow-none hover:bg-white hover:text-gray-700 hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                    }`}
                  >
                    Semua
                  </Button>
                  <Button
                    variant={filterStatus === "replied" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("replied")}
                    className={`h-10 px-3 text-xs flex-1 sm:flex-none !transition-none !transform-none ${
                      filterStatus === "replied"
                        ? "bg-[var(--main)] text-white border-2 border-black shadow-none hover:bg-[var(--main)] hover:text-white hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                        : "bg-white text-gray-700 border-2 border-black shadow-none hover:bg-white hover:text-gray-700 hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                    }`}
                  >
                    Dibalas
                  </Button>
                  <Button
                    variant={filterStatus === "unreplied" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus("unreplied")}
                    className={`h-10 px-3 text-xs flex-1 sm:flex-none !transition-none !transform-none ${
                      filterStatus === "unreplied"
                        ? "bg-[var(--main)] text-white border-2 border-black shadow-none hover:bg-[var(--main)] hover:text-white hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                        : "bg-white text-gray-700 border-2 border-black shadow-none hover:bg-white hover:text-gray-700 hover:shadow-none active:shadow-none focus:shadow-none focus:outline-none focus-visible:ring-0 focus:ring-0 focus:scale-100 active:scale-100"
                    }`}
                  >
                    Belum Dibalas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {filteredMessages.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-gray-500 mb-1">Tidak ada hasil</p>
                  <p className="text-sm text-gray-400">Tidak ada pesan yang cocok dengan pencarian "{searchTerm}"</p>
                </div>
              )}

              {filteredMessages.length === 0 && !searchTerm && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Belum ada pesan</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Bagikan link profil Anda untuk mulai menerima pesan anonim dari teman dan pengikut Anda.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="neo-btn"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: "Kirim pesan anonim ke saya",
                          text: "Kirim pesan anonim ke saya melalui SecretMe",
                          url: `${window.location.origin}/${
                            user.is_premium && user.username ? user.username : user.numeric_id
                          }`,
                        })
                      } else {
                        copyProfileLink()
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Bagikan Profil Anda
                  </Button>
                </div>
              )}

              {filteredMessages.length > 0 && (
                <MessageList
                  messages={filteredMessages}
                  hideReadStatus={true}
                  isPremium={user.is_premium}
                  onReplySuccess={handleReplySuccess}
                  onDeleteSuccess={handleDeleteSuccess}
                  enablePublicReplies={true}
                  username={user.username}
                  numericId={user.numeric_id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="neo-card">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg">Profil</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mb-8">
                <ProfilePreview user={user} />
              </div>

              {user.is_premium ? (
                <div className="space-y-4">
                  {/* Foto Profil Section */}
                  <div className="relative rounded-lg border-2 border-amber-200 p-4 overflow-hidden text-left bg-gradient-to-br from-amber-50/40 to-amber-100/30">
                    {/* Premium badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 border border-black">
                      <Crown className="h-2.5 w-2.5" />
                      <span>Premium</span>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-amber-500/10"></div>
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-orange-500/10"></div>

                    <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-amber-100 text-amber-600 p-1.5 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="10" r="3" />
                          <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                        </svg>
                      </div>
                      <span>Foto Profil</span>
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-center md:items-start">
                      <div className="relative h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-lg border-2 border-amber-200 flex-shrink-0 bg-white">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.name}
                            className="h-full w-full object-cover"
                            width={144}
                            height={144}
                            priority
                            onError={() => {
                              toast({
                                title: "Gagal memuat gambar",
                                description: "URL gambar tidak dapat diakses atau bukan gambar yang valid",
                                variant: "destructive",
                              })
                              // Handle error state here if needed
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-amber-50">
                            <User className="h-12 w-12 sm:h-16 sm:w-16 text-amber-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full">
                        <AvatarUpload userId={user.id} avatarUrl={user.avatar_url} />
                      </div>
                    </div>
                  </div>

                  {/* Username Section */}
                  <div className="relative rounded-lg border border-blue-200 p-4 overflow-hidden text-left bg-gradient-to-br from-blue-50/40 to-blue-100/30">
                    {/* Premium badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                      <Crown className="h-2.5 w-2.5" />
                      <span>Premium</span>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-blue-500/10"></div>
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-indigo-500/10"></div>

                    <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-blue-100 text-blue-600 p-1.5 rounded-lg shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <span>Username Kustom</span>
                    </h3>

                    <div className="mb-4 p-2 sm:p-3 bg-white/50 rounded-lg border border-blue-100">
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Username saat ini:</span>
                          <span className="text-sm font-medium text-blue-700 break-all">
                            {user.username || "Belum diatur"}
                          </span>
                        </div>
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs mt-1 xs:mt-0 self-start xs:self-auto">
                          {user.username ? "Aktif" : "Belum diatur"}
                        </div>
                      </div>
                    </div>

                    <UsernameForm userId={user.id} currentUsername={user.username} />
                  </div>

                  {/* Tambahkan section Name di bawah Username Section dan sebelum Bio Section */}
                  <div className="relative rounded-lg border border-red-200 p-4 overflow-hidden text-left bg-gradient-to-br from-red-50/40 to-red-100/30">
                    {/* Premium badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                      <Crown className="h-2.5 w-2.5" />
                      <span>Premium</span>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-red-500/10"></div>
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-orange-500/10"></div>

                    <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-red-100 text-red-600 p-1.5 rounded-lg shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <span>Ubah Nama</span>
                    </h3>

                    <div className="mb-4 p-2 sm:p-3 bg-white/50 rounded-lg border border-red-100">
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Nama saat ini:</span>
                          <span className="text-sm font-medium text-red-700 break-all">{user.name}</span>
                        </div>
                        <div className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs mt-1 xs:mt-0 self-start xs:self-auto">
                          Aktif
                        </div>
                      </div>
                    </div>

                    <NameForm userId={user.id} currentName={user.name} />
                  </div>

                  {/* Bio Section */}
                  <div className="relative rounded-lg border border-green-200 p-4 overflow-hidden text-left bg-gradient-to-br from-green-50/40 to-green-100/30">
                    {/* Premium badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                      <Crown className="h-2.5 w-2.5" />
                      <span>Premium</span>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-green-500/10"></div>
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-teal-500/10"></div>

                    <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-green-100 text-green-600 p-1.5 rounded-lg shadow-sm">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span>Bio / Deskripsi Singkat</span>
                    </h3>

                    <div className="mb-4 p-3 bg-white/50 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Bio saat ini:</span>
                          <span className="text-sm text-green-700 line-clamp-2">
                            {user.bio || "Belum ada deskripsi"}
                          </span>
                        </div>
                        <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          {user.bio ? "Terisi" : "Kosong"}
                        </div>
                      </div>
                    </div>

                    <BioForm userId={user.id} currentBio={user.bio} />
                  </div>

                  {/* Social Media Section */}
                  <div className="relative rounded-lg border border-purple-200 p-4 overflow-hidden text-left bg-gradient-to-br from-purple-50/40 to-purple-100/30">
                    {/* Premium badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[rgb(250,204,21)] text-black text-[10px] px-2 py-0.5 rounded-[var(--border-radius)] flex items-center gap-1 shadow-sm border border-black">
                      <Crown className="h-2.5 w-2.5" />
                      <span>Premium</span>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-purple-500/10"></div>
                    <div className="absolute -left-6 -bottom-6 w-16 h-16 rounded-full bg-pink-500/10"></div>

                    <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-purple-100 text-purple-600 p-1.5 rounded-lg shadow-sm">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <span>Link Sosial Media</span>
                    </h3>

                    <div className="mb-4 p-2 sm:p-3 bg-white/50 rounded-lg border border-purple-100">
                      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Status sosial media:</span>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                            {user.instagram_url && (
                              <div className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs flex items-center gap-1">
                                <Instagram className="h-3 w-3" />
                                <span>Instagram</span>
                              </div>
                            )}
                            {user.facebook_url && (
                              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                                <Facebook className="h-3 w-3" />
                                <span>Facebook</span>
                              </div>
                            )}
                            {user.linkedin_url && (
                              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                                <Linkedin className="h-3 w-3" />
                                <span>LinkedIn</span>
                              </div>
                            )}
                            {user.tiktok_url && (
                              <div className="px-2 py-0.5 bg-black bg-opacity-10 text-black rounded-full text-xs flex items-center gap-1">
                                <BrandTiktok className="h-3 w-3" />
                                <span>TikTok</span>
                              </div>
                            )}
                            {socialMediaCount === 0 && (
                              <span className="text-sm text-purple-700">Belum ada sosial media</span>
                            )}
                          </div>
                        </div>
                        <div className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs self-start">
                          {socialMediaCount > 0 ? `${socialMediaCount} Aktif` : "Kosong"}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      Tambahkan link sosial media Anda untuk ditampilkan di profil publik
                    </p>
                    <SocialMediaForm
                      userId={user.id}
                      instagramUrl={user.instagram_url}
                      facebookUrl={user.facebook_url}
                      linkedinUrl={user.linkedin_url}
                      tiktokUrl={user.tiktok_url}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Locked premium features for free users */}
                  <div className="relative rounded-lg border-2 border-gray-200 p-4 overflow-hidden text-left bg-gray-50/50">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="bg-white p-4 rounded-lg border-2 border-amber-200 shadow-lg text-center max-w-xs">
                        <Lock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                        <h3 className="font-bold text-lg mb-1">Fitur Premium</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Upgrade ke premium untuk mengakses semua fitur profil
                        </p>
                        <Button asChild className="neo-btn w-full">
                          <Link href="/premium">
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade Sekarang
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-amber-100 text-amber-600 p-1.5 rounded-lg">
                        <User className="h-4 w-4" />
                      </div>
                      <span>Foto Profil</span>
                    </h3>
                    <div className="h-32 w-full bg-gray-100 rounded-lg border border-gray-200 mb-4"></div>

                    <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                        <User className="h-4 w-4" />
                      </div>
                      <span>Username Kustom</span>
                    </h3>
                    <div className="h-24 w-full bg-gray-100 rounded-lg border border-gray-200 mb-4"></div>

                    <h3 className="font-semibold mb-3 text-sm sm:text-base flex items-center gap-2 text-gray-800">
                      <div className="flex items-center justify-center bg-green-100 text-green-600 p-1.5 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span>Bio / Deskripsi Singkat</span>
                    </h3>
                    <div className="h-24 w-full bg-gray-100 rounded-lg border border-gray-200"></div>
                  </div>

                  {/* Premium CTA with detailed benefits */}
                  <div className="bg-[rgb(250,204,21)]/10 p-6 rounded-lg border-2 border-[rgb(250,204,21)] mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-[var(--main)] border-2 border-black flex items-center justify-center">
                        <Crown className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Upgrade ke Premium</h3>
                        <p className="text-sm text-gray-600">Akses semua fitur premium dengan sekali bayar</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Username Kustom</p>
                          <p className="text-sm text-gray-600">Pilih username unik untuk link profil Anda</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Foto Profil</p>
                          <p className="text-sm text-gray-600">Unggah foto profil Anda sendiri</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Bio Profil</p>
                          <p className="text-sm text-gray-600">Tambahkan deskripsi singkat tentang diri Anda</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Link Sosial Media</p>
                          <p className="text-sm text-gray-600">
                            Tambahkan link Instagram, Facebook, LinkedIn, dan TikTok
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Hapus Pesan</p>
                          <p className="text-sm text-gray-600">Hapus pesan yang tidak diinginkan</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Balasan Publik</p>
                          <p className="text-sm text-gray-600">Aktifkan balasan publik untuk pesan Anda</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Akses Selamanya</p>
                          <p className="text-sm text-gray-600">Bayar sekali, akses premium selamanya</p>
                        </div>
                      </div>
                    </div>

                    <Button asChild className="neo-btn w-full">
                      <Link href="/premium">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Sekarang
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="neo-card">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Pengaturan Akun
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium mb-3 text-sm sm:text-base">Informasi Akun</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-xs text-gray-500 w-20">Nama:</span>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-xs text-gray-500 w-20">Email:</span>
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-xs text-gray-500 w-20">Status:</span>
                      <span className="text-sm">
                        {user.is_premium ? (
                          <Badge className="bg-[rgb(250,204,21)] text-black border border-amber-500 rounded-[var(--border-radius)] text-[10px] font-normal">
                            <Crown className="h-2.5 w-2.5 mr-1" />
                            <span>Premium</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            Gratis
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                      <span className="text-xs text-gray-500 w-20">Bergabung:</span>
                      <span className="text-xs text-gray-600">
                        {new Date(user.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-medium mb-3 text-sm sm:text-base">Keluar Akun</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Keluar dari akun Anda pada perangkat ini. Anda dapat masuk kembali kapan saja.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full sm:w-auto neo-btn-outline"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Keluar
                  </Button>
                </div>

                <div className="rounded-lg border border-red-200 p-4 bg-red-50">
                  <h3 className="font-medium mb-3 text-sm sm:text-base text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Hapus Akun
                  </h3>
                  <p className="text-xs text-red-600 mb-3">
                    Menghapus akun Anda akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat
                    dibatalkan.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Akun
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Permanen</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus akun Anda dan semua data terkait secara permanen. Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isLoading}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></div>
                  Menghapus...
                </>
              ) : (
                "Hapus Akun"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
