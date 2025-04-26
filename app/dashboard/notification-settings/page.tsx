import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SimpleNotificationPreferences } from "@/components/simple-notification-preferences"

export default async function NotificationSettingsPage() {
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

  // Ambil preferensi notifikasi
  const { data: preferences, error: preferencesError } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  // Default ke enabled jika preferensi belum diatur
  const notificationsEnabled = preferences ? preferences.new_messages : true

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Pengaturan Notifikasi</h1>

      <div className="grid gap-6">
        <SimpleNotificationPreferences userId={session.user.id} initialEnabled={notificationsEnabled} />
      </div>
    </div>
  )
}
