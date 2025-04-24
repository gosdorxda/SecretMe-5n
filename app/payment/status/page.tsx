import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PaymentStatusClient } from "./client"

export const dynamic = "force-dynamic"

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: { order_id?: string; status?: string }
}) {
  const supabase = createClient()
  const { order_id, status } = searchParams

  // Redirect jika tidak ada order_id
  if (!order_id) {
    redirect("/dashboard")
  }

  // Cek apakah user sudah login
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login?redirect=/payment/status?order_id=" + order_id)
  }

  // Ambil data transaksi
  const { data: transaction, error: transactionError } = await supabase
    .from("premium_transactions")
    .select("*, users(name, email, is_premium)")
    .eq("plan_id", order_id)
    .single()

  // Jika transaksi tidak ditemukan atau bukan milik user yang login
  if (transactionError || !transaction || transaction.user_id !== user.id) {
    redirect("/dashboard?error=transaction_not_found")
  }

  // Jika status dari URL berbeda dengan status di database, update status di database
  // Ini untuk kasus di mana user diarahkan dari callback Midtrans dengan status baru
  if (status && status !== transaction.status && ["success", "pending", "failed"].includes(status)) {
    await supabase.from("premium_transactions").update({ status }).eq("id", transaction.id)

    // Jika status success, update user menjadi premium
    if (status === "success" && !transaction.users?.is_premium) {
      await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: null, // Lifetime premium
        })
        .eq("id", user.id)
    }

    // Refresh data transaksi
    const { data: refreshedTransaction } = await supabase
      .from("premium_transactions")
      .select("*, users(name, email, is_premium)")
      .eq("plan_id", order_id)
      .single()

    if (refreshedTransaction) {
      transaction.status = refreshedTransaction.status
      transaction.users = refreshedTransaction.users
    }
  }

  return <PaymentStatusClient transaction={transaction} />
}
