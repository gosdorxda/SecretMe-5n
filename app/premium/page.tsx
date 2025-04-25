import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PremiumClient } from "./client"

export const dynamic = "force-dynamic"

export default async function PremiumPage() {
  const supabase = createClient()

  // Cek apakah user sudah login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Redirect ke halaman login jika belum login
    return redirect("/login?redirect=/premium")
  }

  // Cek apakah user sudah premium
  const { data: userData } = await supabase.from("users").select("is_premium").eq("id", user.id).single()

  // Jika sudah premium, redirect ke dashboard
  if (userData?.is_premium) {
    return redirect("/dashboard?message=already-premium")
  }

  return <PremiumClient />
}
