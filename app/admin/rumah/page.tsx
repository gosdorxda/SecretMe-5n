import { redirect } from "next/navigation"
import { getVerifiedUser, isAdmin } from "@/lib/supabase/server"
import RumahDashboard from "./rumah-dashboard"

export const dynamic = "force-dynamic"

export default async function RumahPage() {
  // Dapatkan user terverifikasi
  const { user, error } = await getVerifiedUser()

  if (error || !user) {
    redirect("/login?redirect=/admin/rumah")
  }

  // Periksa apakah user adalah admin
  const adminStatus = await isAdmin(user.id)

  if (!adminStatus) {
    redirect("/dashboard?error=unauthorized")
  }

  return <RumahDashboard userId={user.id} />
}
