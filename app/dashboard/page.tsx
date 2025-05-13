import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"

export default async function DashboardPage() {
  const supabase = createClient(cookies())

  // Periksa apakah pengguna sudah login
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Verifikasi pengguna dengan getUser()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error verifying user:", userError)
    redirect("/login")
  }

  // Ambil data pengguna
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id) // Gunakan user.id yang terverifikasi
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
    .maybeSingle() // Gunakan maybeSingle() alih-alih single()

  // Jika tidak ada data atau error, buat record baru dengan count 0
  if (viewsError || !profileViews) {
    console.log("Tidak ada data profile views, membuat record baru")

    // Coba buat record baru
    try {
      await supabase.from("profile_views").insert({
        user_id: session.user.id,
        count: 0,
      })
    } catch (insertError) {
      console.error("Error saat membuat profile views:", insertError)
    }
  }

  const viewCount = profileViews?.count || 0

  return <DashboardClient user={userData} messages={messages || []} viewCount={viewCount} />
}
