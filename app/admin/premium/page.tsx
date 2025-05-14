import { createClient } from "@/lib/supabase/server"
import PremiumSettings from "../components/premium-settings"

export const dynamic = "force-dynamic"

export default async function PremiumPage() {
  const supabase = createClient()

  // Ambil pengaturan premium dari database
  const { data: settingsData } = await supabase
    .from("site_config")
    .select("*")
    .eq("type", "premium_settings")
    .single()
    .catch(() => ({ data: null }))

  // Ambil jumlah pengguna premium
  const { count: premiumCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true)

  // Ambil transaksi terbaru
  const { data: recentTransactions } = await supabase
    .from("premium_transactions")
    .select(
      `
      *,
      users:user_id (
        email,
        name,
        username
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(5)

  // Transform data transaksi
  const transformedTransactions =
    recentTransactions?.map((item) => ({
      ...item,
      user_email: item.users?.email,
      user_name: item.users?.name,
    })) || []

  // Default settings jika tidak ada di database
  const settings = settingsData?.config || {
    price: Number.parseInt(process.env.NEXT_PUBLIC_PREMIUM_PRICE || "49000", 10),
    activeGateway: process.env.NEXT_PUBLIC_ACTIVE_PAYMENT_GATEWAY || "duitku",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Premium</h1>
        <p className="text-muted-foreground">Kelola fitur premium, harga, dan transaksi.</p>
      </div>

      <PremiumSettings initialSettings={settings} initialTransactions={transformedTransactions} />
    </div>
  )
}
