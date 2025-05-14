import type React from "react"
import { redirect } from "next/navigation"
import { getSessionCache, isAdminCache } from "@/lib/auth-cache"
import AdminSidebar from "./components/admin-sidebar"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gunakan cache untuk mendapatkan session
  const { session, user, error } = await getSessionCache()

  if (error || !session || !user) {
    redirect("/login?redirect=/admin")
  }

  // Periksa apakah user adalah admin menggunakan cache
  const adminStatus = await isAdminCache(user.id)

  if (!adminStatus) {
    redirect("/dashboard?error=unauthorized")
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <AdminSidebar />
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</div>
    </div>
  )
}
