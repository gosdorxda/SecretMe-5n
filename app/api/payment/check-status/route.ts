import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"

export async function GET(request: NextRequest) {
  const requestId = `check-status-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  console.log(`[${requestId}] 🔍 Checking transaction status`)

  try {
    // Ambil order_id dari query parameter
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    if (!orderId) {
      console.log(`[${requestId}] ❌ Missing order_id parameter`)
      return NextResponse.json({ error: "Missing order_id parameter" }, { status: 400 })
    }

    console.log(`[${requestId}] 🔍 Checking status for order_id: ${orderId}`)

    // Verifikasi user - gunakan getSession() alih-alih getUser()
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      console.log(`[${requestId}] ❌ Unauthorized - No user found`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user
    console.log(`[${requestId}] 👤 User authenticated: ${user.id}`)

    // Cari transaksi di database
    const { data: transaction, error: findError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("plan_id", orderId)
      .single()

    if (findError) {
      console.log(`[${requestId}] ❌ Transaction not found: ${findError.message}`)
      return NextResponse.json({ error: "Transaction not found", details: findError.message }, { status: 404 })
    }

    console.log(
      `[${requestId}] ✅ Found transaction: ${transaction.id}, Status: ${transaction.status}, Gateway: ${transaction.payment_gateway || "duitku"}`,
    )

    // Verifikasi bahwa transaksi milik user yang sedang login
    if (transaction.user_id !== user.id) {
      console.log(`[${requestId}] ❌ Unauthorized - Transaction belongs to different user`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Jika transaksi sudah success atau failed, tidak perlu cek lagi
    if (transaction.status === "success" || transaction.status === "failed") {
      console.log(`[${requestId}] ℹ️ Transaction already in final state: ${transaction.status}`)
      return NextResponse.json({
        success: true,
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
    const gatewayName = transaction.payment_gateway || "duitku"
    console.log(`[${requestId}] 🔄 Checking status with payment gateway: ${gatewayName}`)

    // Log additional info for TriPay
    if (gatewayName === "tripay") {
      console.log(`[${requestId}] 🔍 TriPay transaction check - Order ID: ${orderId}`)
      console.log(`[${requestId}] 🔍 TriPay payment details:`, JSON.stringify(transaction.payment_details || {}))
    }

    const gateway = await getPaymentGateway(gatewayName)
    const result = await gateway.verifyTransaction(orderId)

    console.log(`[${requestId}] 📊 Gateway verification result: isValid=${result.isValid}, status=${result.status}`)

    // Log additional details for debugging
    if (gatewayName === "tripay") {
      console.log(`[${requestId}] 📊 TriPay verification details:`, JSON.stringify(result.details || {}))
    }

    // Update status transaksi jika berbeda
    if (result.isValid && result.status !== "unknown" && result.status !== transaction.status) {
      console.log(`[${requestId}] 📝 Updating transaction status from ${transaction.status} to ${result.status}`)

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
        console.error(`[${requestId}] ❌ Error updating transaction:`, updateError)
      } else {
        console.log(`[${requestId}] ✅ Transaction status updated successfully`)
      }

      // Jika status berubah menjadi success, update status premium user
      if (result.status === "success") {
        console.log(`[${requestId}] 🌟 Upgrading user to premium status`)

        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            is_premium: true,
            premium_expires_at: null, // Lifetime premium
          })
          .eq("id", user.id)

        if (userUpdateError) {
          console.error(`[${requestId}] ❌ Error updating user premium status:`, userUpdateError)
        } else {
          console.log(`[${requestId}] 🎊 User premium status updated successfully`)
        }
      }
    }

    // Ambil data transaksi terbaru setelah update
    const { data: updatedTransaction } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("plan_id", orderId)
      .single()

    const finalStatus = updatedTransaction
      ? updatedTransaction.status
      : result.isValid
        ? result.status
        : transaction.status

    console.log(`[${requestId}] 🏁 Final transaction status: ${finalStatus}`)

    // Log transaction check to database
    try {
      console.log(`[${requestId}] 📝 Logging transaction check to payment_notification_logs table`)
      const { error: logError } = await supabase.from("payment_notification_logs").insert({
        request_id: requestId,
        gateway: gatewayName,
        raw_payload: null,
        parsed_payload: result.details,
        headers: Object.fromEntries(request.headers.entries()),
        status: finalStatus,
        transaction_id: transaction.id,
        order_id: orderId,
        error: result.isValid ? null : "Verification failed",
      })

      if (logError) {
        console.error(`[${requestId}] ⚠️ Failed to log transaction check:`, logError)
      } else {
        console.log(`[${requestId}] ✅ Transaction check logged successfully`)
      }
    } catch (logError) {
      console.error(`[${requestId}] ⚠️ Error logging transaction check:`, logError)
      // Continue processing even if logging fails
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      transaction: updatedTransaction || {
        id: transaction.id,
        plan_id: transaction.plan_id,
        amount: transaction.amount,
        status: finalStatus,
        payment_method: result.paymentMethod || transaction.payment_method,
        created_at: transaction.created_at,
        updated_at: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error(`[${requestId}] 💥 Error checking transaction status:`, error)
    console.error(`[${requestId}] 📋 Error details:`, error.stack || "No stack trace available")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        success: false,
      },
      { status: 500 },
    )
  }
}
