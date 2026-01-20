import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"

// Paksa dynamic rendering untuk halaman yang memerlukan auth
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  // Gunakan createServerClient dengan cookies
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )

  // Dapatkan session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  // Log untuk debugging
  console.log("Dashboard page session check:", !!session, sessionError ? "Error: " + sessionError.message : "")

  // Redirect ke login jika tidak ada session
  if (!session || !session.user) {
    console.log("No session found, redirecting to login")
    redirect("/login?redirect=/dashboard")
  }

  // Ambil data pengguna
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
