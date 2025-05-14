import { createClient } from "@/lib/supabase/server"
import PremiumManagement from "../components/premium-management"

export const dynamic = "force-dynamic"

export default async function PremiumPage() {
  // Ambil data untuk halaman premium
  const supabase = createClient()

  // Ambil jumlah pengguna premium
  const { count: premiumCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true)

  // Ambil transaksi terbaru
  const { data: recentTransactions } = await supabase
    .from("premium_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Premium</h1>
        <p className="text-muted-foreground">Kelola fitur premium dan transaksi.</p>
      </div>

      <PremiumManagement premiumCount={premiumCount || 0} recentTransactions={recentTransactions || []} />
    </div>
  )
}
