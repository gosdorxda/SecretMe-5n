import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NotificationSettingsForm } from "@/components/notification-settings-form"

export default async function NotificationSettingsPage() {
  const supabase = createClient(cookies())

  // Verifikasi user dengan getUser() yang lebih aman
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Dapatkan data user
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("telegram_id, is_premium")
    .eq("id", user.id)
    .single()

  if (userDataError) {
    console.error("Error fetching user data:", userDataError)
    return <div>Error loading user data</div>
  }

  // Redirect jika bukan pengguna premium
  if (!userData.is_premium) {
    redirect("/premium")
  }

  const telegramConnected = !!userData.telegram_id

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Pengaturan Notifikasi</h1>

      <NotificationSettingsForm
        userId={user.id}
        telegramConnected={telegramConnected}
        telegramId={userData.telegram_id}
      />
    </div>
  )
}
