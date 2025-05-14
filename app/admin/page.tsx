import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "./components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  // Ambil data untuk dashboard
  const supabase = createClient()

  // Ambil jumlah pengguna
  const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true })

  // Ambil jumlah pengguna premium
  const { count: premiumCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true)

  // Ambil jumlah pesan
  const { count: messageCount } = await supabase.from("messages").select("*", { count: "exact", head: true })

  // Ambil pengguna terbaru
  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, name, email, username, created_at, is_premium")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <AdminDashboard
      stats={{
        userCount: userCount || 0,
        premiumCount: premiumCount || 0,
        messageCount: messageCount || 0,
        premiumPercentage: userCount ? Math.round(((premiumCount || 0) / userCount) * 100) : 0,
      }}
      recentUsers={recentUsers || []}
    />
  )
}
