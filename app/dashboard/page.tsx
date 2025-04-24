import { redirect } from "next/navigation"
import { createClient, getVerifiedUser } from "@/lib/supabase/server"
import { DashboardClient } from "./client"

export default async function Dashboard() {
  const supabase = createClient()

  // Dapatkan user terverifikasi
  const { user, error } = await getVerifiedUser()

  if (error || !user) {
    redirect("/login")
  }

  // Ambil data user dari database menggunakan ID yang terverifikasi
  const { data: userData } = await supabase
    .from("users")
    .select("*, instagram_url, facebook_url, linkedin_url, tiktok_url")
    .eq("id", user.id)
    .single()

  if (!userData) {
    redirect("/login")
  }

  // Ambil pesan
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <DashboardClient user={userData} messages={messages || []} />
}
