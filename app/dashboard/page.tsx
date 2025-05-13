import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"

export default async function DashboardPage() {
  const supabase = createClient()

  // Periksa apakah pengguna sudah login
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Ambil data pengguna dari database
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (userDataError || !userData) {
    console.error("Error fetching user data:", userDataError)
    redirect("/login")
  }

  // Ambil pesan pengguna
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (messagesError) {
    console.error("Error fetching messages:", messagesError)
  }

  // Ambil jumlah view profil
  const { data: profileViews, error: viewsError } = await supabase
    .from("profile_views")
    .select("count")
    .eq("user_id", session.user.id)
    .maybeSingle()

  const viewCount = profileViews?.count || 0

  return <DashboardClient user={userData} messages={messages || []} viewCount={viewCount} />
}
