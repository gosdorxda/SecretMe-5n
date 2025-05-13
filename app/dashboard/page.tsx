import { getSessionCache } from "@/lib/auth-cache"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"

// Paksa dynamic rendering untuk halaman yang memerlukan auth
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  // Gunakan cache untuk mendapatkan session
  const { session, user, error } = await getSessionCache()

  // Redirect ke login jika tidak ada session
  if (!session || !user) {
    redirect("/login?redirect=/dashboard")
  }

  // Gunakan user dari session tanpa memanggil getUser()
  const supabase = createClient()

  // Ambil data pengguna
  const { data: userData, error: userDataError } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (userDataError || !userData) {
    console.error("Error fetching user data:", userDataError)
    redirect("/login")
  }

  // Ambil pesan pengguna
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (messagesError) {
    console.error("Error fetching messages:", messagesError)
  }

  // Ambil jumlah view profil
  const { data: profileViews, error: viewsError } = await supabase
    .from("profile_views")
    .select("count")
    .eq("user_id", user.id)
    .maybeSingle()

  const viewCount = profileViews?.count || 0

  return <DashboardClient user={userData} messages={messages || []} viewCount={viewCount} />
}
