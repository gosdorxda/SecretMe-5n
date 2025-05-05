import { redirect } from "next/navigation"
import { getVerifiedUser, isAdmin } from "@/lib/supabase/server"
import PremiumSettings from "./premium-settings"
import PaymentMethodPrices from "./payment-method-prices"

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
