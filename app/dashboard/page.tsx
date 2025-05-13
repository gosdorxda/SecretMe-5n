import { getSessionCache } from "@/lib/auth-cache"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "./client"
import { logAuthRequest } from "@/lib/auth-logger"

// Paksa dynamic rendering untuk halaman yang memerlukan auth
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const start = performance.now()
  let success = false
  let error = null

  try {
    // Log attempt
    logAuthRequest({
      endpoint: "dashboardPage",
      method: "GET",
      source: "server",
      success: true,
      duration: 0,
      cached: false,
      details: { action: "start" },
    })

    // Gunakan cache untuk mendapatkan session
    const { session, user, error: sessionError } = await getSessionCache()

    // Redirect ke login jika tidak ada session
    if (!session || !user) {
      logAuthRequest({
        endpoint: "dashboardPage",
        method: "GET",
        source: "server",
        success: false,
        duration: performance.now() - start,
        cached: false,
        error: "No session",
        details: { action: "redirect" },
      })

      redirect("/login?redirect=/dashboard")
    }

    // Gunakan user dari session tanpa memanggil getUser()
    const supabase = createClient()

    // Ambil data pengguna
    const { data: userData, error: userDataError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userDataError || !userData) {
      console.error("Error fetching user data:", userDataError)

      logAuthRequest({
        endpoint: "dashboardPage",
        method: "GET",
        source: "server",
        success: false,
        duration: performance.now() - start,
        cached: false,
        error: userDataError ? userDataError.message : "No user data",
        details: { action: "fetchUserData" },
      })

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

    success = true

    // Log success
    logAuthRequest({
      endpoint: "dashboardPage",
      method: "GET",
      source: "server",
      success: true,
      duration: performance.now() - start,
      cached: false,
      userId: user.id,
      details: { action: "success" },
    })

    return <DashboardClient user={userData} messages={messages || []} viewCount={viewCount} />
  } catch (err) {
    error = err
    console.error("Error in dashboard page:", err)

    // Log error
    logAuthRequest({
      endpoint: "dashboardPage",
      method: "GET",
      source: "server",
      success: false,
      duration: performance.now() - start,
      cached: false,
      error: err instanceof Error ? err.message : String(err),
      details: { action: "error" },
    })

    redirect("/login?error=server_error")
  }
}
