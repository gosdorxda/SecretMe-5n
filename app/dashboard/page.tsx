import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"

export default async function DashboardPage() {
  const supabase = createClient(cookies())

  // Gunakan getUser() yang lebih aman daripada getSession()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    console.error("Error fetching user data:", userError)
    redirect("/login")
  }

  // Ambil data pengguna dari database
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user.id)
    .single()

  if (profileError || !userProfile) {
    console.error("Error fetching user profile:", profileError)
    redirect("/login")
  }

  // Ambil pesan pengguna
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })

  if (messagesError) {
    console.error("Error fetching messages:", messagesError)
  }

  // Ambil jumlah view profil
  const { data: profileViews, error: viewsError } = await supabase
    .from("profile_views")
    .select("count")
    .eq("user_id", userData.user.id)
    .single()

  const viewCount = viewsError ? 0 : profileViews?.count || 0

  return <DashboardClient user={userProfile} messages={messages || []} viewCount={viewCount} />
}
