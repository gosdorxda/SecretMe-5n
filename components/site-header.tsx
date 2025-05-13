"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { signOutWithLogging } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, LogOut } from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Implementasi universal untuk logout
  async function handleLogout() {
    try {
      // Gunakan fungsi signOutWithLogging yang sudah dioptimasi
      await signOutWithLogging()

      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari akun",
      })

      // Redirect dan refresh
      router.push("/")
      router.refresh()

      // Force reload halaman untuk memastikan state bersih
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "Logout gagal",
        description: error.message || "Terjadi kesalahan saat logout",
        variant: "destructive",
      })

      // Fallback: force reload halaman
      window.location.href = "/"
    }
  }

  return (
    <header className="w-full py-4 bg-[var(--bg)]">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--border-radius)] bg-[var(--main)] border-2 border-[var(--border)] shadow-neo-sm">
            <MessageSquare className="h-4 w-4 text-[var(--mtext)]" />
          </div>
          <span className="font-bold text-lg">Secretme</span>
        </Link>

        <div className="flex items-center gap-4">
          {!loading && !session ? (
            <Button className="rounded-full" size="sm" asChild>
              <Link href="/register">Mulai Sekarang</Link>
            </Button>
          ) : (
            <>
              <Button className="rounded-full" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
