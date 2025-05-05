import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PremiumSettings from "./premium-settings"
import PaymentMethodPrices from "./payment-method-prices"

export default async function AdminPremiumPage() {
  const supabase = createClient()

  // Verifikasi user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verifikasi admin
  const { data: userData } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

  if (!userData?.is_admin) {
    redirect("/dashboard")
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pengaturan Premium</h1>
        <p className="text-muted-foreground">Kelola pengaturan premium dan pembayaran</p>
      </div>

      <div className="space-y-6">
        {/* Existing Premium Settings Component */}
        <PremiumSettings />

        {/* New Payment Method Prices Component */}
        <PaymentMethodPrices />
      </div>
    </div>
  )
}
