import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"

export async function GET(request: NextRequest) {
  try {
    // Ambil order_id dari query parameter
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id parameter" }, { status: 400 })
    }

    // Verifikasi user
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Cari transaksi di database
    const { data: transaction, error: findError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("plan_id", orderId)
      .single()

    if (findError) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Verifikasi bahwa transaksi milik user yang sedang login
    if (transaction.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Jika transaksi sudah success atau failed, tidak perlu cek lagi
    if (transaction.status === "success" || transaction.status === "failed") {
      return NextResponse.json({
        status: transaction.status,
        transaction: {
          id: transaction.id,
          plan_id: transaction.plan_id,
          amount: transaction.amount,
          status: transaction.status,
          payment_method: transaction.payment_method,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        },
      })
    }

    // Jika masih pending, cek status di gateway
    const gateway = await getPaymentGateway(transaction.payment_gateway || "duitku")
    const result = await gateway.verifyTransaction(orderId)

    // Update status transaksi jika berbeda
    if (result.isValid && result.status !== "unknown" && result.status !== transaction.status) {
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: result.status,
          payment_method: result.paymentMethod || transaction.payment_method,
          payment_details: result.details || transaction.payment_details,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("Error updating transaction:", updateError)
      }

      // Jika status berubah menjadi success, update status premium user
      if (result.status === "success") {
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            is_premium: true,
            premium_expires_at: null, // Lifetime premium
          })
          .eq("id", user.id)

        if (userUpdateError) {
          console.error("Error updating user premium status:", userUpdateError)
        }
      }
    }

    return NextResponse.json({
      status: result.isValid ? result.status : transaction.status,
      transaction: {
        id: transaction.id,
        plan_id: transaction.plan_id,
        amount: transaction.amount,
        status: result.isValid ? result.status : transaction.status,
        payment_method: result.paymentMethod || transaction.payment_method,
        created_at: transaction.created_at,
        updated_at: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error checking transaction status:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
