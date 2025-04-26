import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NotificationHistory } from "./notification-history"

export default async function NotificationsPage() {
  const supabase = createClient(cookies())

  // Cek session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Ambil data user
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (userError || !userData) {
    console.error("Error fetching user data:", userError)
    redirect("/login")
  }

  // Ambil riwayat notifikasi
  const { data: notifications, error: notificationsError } = await supabase
    .from("notification_logs")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (notificationsError) {
    console.error("Error fetching notifications:", notificationsError)
  }

  // Ambil preferensi notifikasi
  const { data: preferences, error: preferencesError } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  const defaultPreferences = {
    newMessages: true,
    messageReplies: true,
    systemUpdates: true,
  }

  const userPreferences = preferences
    ? {
        newMessages: preferences.new_messages,
        messageReplies: preferences.message_replies,
        systemUpdates: preferences.system_updates,
      }
    : defaultPreferences

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notifikasi</h1>

      <div className="grid gap-6">
        <NotificationHistory
          notifications={notifications || []}
          userId={session.user.id}
          userPreferences={userPreferences}
        />
      </div>
    </div>
  )
}
