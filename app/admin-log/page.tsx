import { redirect } from "next/navigation"
import { createClient, getVerifiedUser, isAdmin } from "@/lib/supabase/server"
import AdminLogDashboard from "./admin-log-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminLogPage() {
  const supabase = createClient()

  // Dapatkan user terverifikasi
  const { user, error } = await getVerifiedUser()

  if (error || !user) {
    redirect("/login?redirect=/admin-log")
  }

  // Periksa apakah user adalah admin
  const adminStatus = await isAdmin(user.id)

  if (!adminStatus) {
    redirect("/dashboard?error=unauthorized")
  }

  // Ambil data log terbaru untuk ditampilkan
  const { data: paymentLogs } = await supabase
    .from("payment_notification_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: transactionLogs } = await supabase
    .from("transaction_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: sitemapLogs } = await supabase
    .from("sitemap_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <AdminLogDashboard
      initialPaymentLogs={paymentLogs || []}
      initialTransactionLogs={transactionLogs || []}
      initialSitemapLogs={sitemapLogs || []}
    />
  )
}
