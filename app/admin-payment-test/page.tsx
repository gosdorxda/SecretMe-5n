import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PaymentTestDashboard } from "./payment-test-dashboard"

export default async function PaymentTestPage() {
  const supabase = createClient()

  // Verifikasi user adalah admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/admin-payment-test")
  }

  // Periksa apakah user adalah admin
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "admin") {
    redirect("/dashboard")
  }

  return <PaymentTestDashboard userId={user.id} />
}
