import { redirect } from "next/navigation"
import { getVerifiedUser, isAdmin } from "@/lib/supabase/server"
import PremiumSettings from "./premium-settings"

export const dynamic = "force-dynamic"

export default async function AdminPremiumPage() {
  // Dapatkan user terverifikasi
  const { user, error } = await getVerifiedUser()

  if (error || !user) {
    redirect("/login?redirect=/admin-premium")
  }

  // Periksa apakah user adalah admin
  const adminStatus = await isAdmin(user.id)

  if (!adminStatus) {
    redirect("/dashboard?error=unauthorized")
  }

  return <PremiumSettings />
}
