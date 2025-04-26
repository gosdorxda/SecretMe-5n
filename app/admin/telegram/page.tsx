import { redirect } from "next/navigation"
import { createClient, getVerifiedUser, isAdmin } from "@/lib/supabase/server"
import { TelegramWebhookSetup } from "../telegram-webhook-setup"

export const dynamic = "force-dynamic"

export default async function TelegramWebhookPage() {
  const supabase = createClient()

  // Dapatkan user terverifikasi
  const { user, error } = await getVerifiedUser()

  if (error || !user) {
    redirect("/login?redirect=/admin/telegram")
  }

  // Periksa apakah user adalah admin
  const adminStatus = await isAdmin(user.id)

  if (!adminStatus) {
    redirect("/dashboard?error=unauthorized")
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Telegram Webhook Setup</h1>
      <TelegramWebhookSetup />
    </div>
  )
}
