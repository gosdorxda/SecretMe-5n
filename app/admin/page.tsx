import { redirect } from "next/navigation"
import { createClient, getVerifiedUser, isAdmin } from "@/lib/supabase/server"
import AdminDashboard from "./admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = createClient()

  // Dapatkan user terverifikasi
  const { user, error } = await getVerifiedUser()

  if (error || !user) {
    redirect("/login?redirect=/admin")
  }

  // Periksa apakah user adalah admin
  const adminStatus = await isAdmin(user.id)

  if (!adminStatus) {
    redirect("/dashboard?error=unauthorized")
  }

  // Ambil data pengguna untuk ditampilkan
  const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  return <AdminDashboard initialUsers={users || []} />
}
