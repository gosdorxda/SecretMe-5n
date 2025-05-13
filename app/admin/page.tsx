import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSessionCache, isAdminCache } from "@/lib/auth-cache"
import AdminDashboard from "./admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
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

  // Ambil data pengguna untuk ditampilkan
  const supabase = createClient()
  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  return <AdminDashboard initialUsers={users || []} />
}
