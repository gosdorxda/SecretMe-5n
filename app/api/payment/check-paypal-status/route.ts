import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createPaymentLogger } from "@/lib/payment/payment-logger"

export async function GET(request: NextRequest) {
  const logger = createPaymentLogger("paypal-check")
  logger.info("Checking PayPal payment status")

  try {
    // Get orderId from query params
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      logger.error("Missing orderId parameter")
      return NextResponse.json({ success: false, error: "Missing orderId parameter" }, { status: 400 })
    }

    logger.info("Checking PayPal order status", { orderId })

    // Get user session
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.error("Unauthorized user")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Cari transaksi di database
    // Pertama, coba cari berdasarkan gateway_reference
    let { data: transaction, error: findError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("gateway_reference", orderId)
      .single()

    // Jika tidak ditemukan, coba cari berdasarkan plan_id
    if (findError) {
      logger.debug("Transaction not found by gateway_reference, trying plan_id", { orderId })
      const { data: transactionByPlanId, error: findByPlanIdError } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("plan_id", orderId)
        .single()

      if (findByPlanIdError) {
        logger.error("Transaction not found", findByPlanIdError, { orderId })
        return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
      }

      transaction = transactionByPlanId
    }

    logger.info("Found transaction", {
      transactionId: transaction.id,
      userId: transaction.user_id,
      status: transaction.status,
      gateway: transaction.payment_gateway,
    })

    // Jika transaksi sudah success, tidak perlu memeriksa lagi
    if (transaction.status === "success") {
      logger.info("Transaction already successful", { transactionId: transaction.id })
      return NextResponse.json({
        success: true,
        status: "success",
        message: "Transaction already successful",
      })
    }

    // Dapatkan ID PayPal yang sebenarnya dari gateway_reference atau payment_details
    const paypalOrderId = transaction.gateway_reference || transaction.payment_details?.id

    if (!paypalOrderId) {
      logger.error("No PayPal order ID found in transaction", null, { transactionId: transaction.id })
      return NextResponse.json({ success: false, error: "No PayPal order ID found in transaction" }, { status: 400 })
    }

    // Periksa status di PayPal
    const paypalResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
    })

    if (!paypalResponse.ok) {
      const errorText = await paypalResponse.text()
      logger.error("Failed to check PayPal order status", null, {
        status: paypalResponse.status,
        response: errorText,
      })
      return NextResponse.json(
        { success: false, error: `Failed to check PayPal order status: ${paypalResponse.status}` },
        { status: 500 },
      )
    }

    const paypalData = await paypalResponse.json()
    logger.info("PayPal order status", { orderId: paypalOrderId, status: paypalData.status })

    // Update transaksi jika status PayPal adalah COMPLETED
    if (paypalData.status === "COMPLETED") {
      logger.info("Updating transaction to success", { transactionId: transaction.id })

      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "success",
          payment_method: "PayPal",
          payment_details: paypalData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction", updateError, { transactionId: transaction.id })
        return NextResponse.json({ success: false, error: "Failed to update transaction" }, { status: 500 })
      }

      // Update user premium status
      logger.info("Updating user premium status", { userId: user.id })
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: null, // Lifetime premium
        })
        .eq("id", user.id)

      if (userUpdateError) {
        logger.error("Failed to update user premium status", userUpdateError, { userId: user.id })
        return NextResponse.json({ success: false, error: "Failed to update user premium status" }, { status: 500 })
      }

      logger.info("User upgraded to premium", { userId: user.id })
      return NextResponse.json({
        success: true,
        status: "success",
        message: "Payment completed and user upgraded to premium",
      })
    }

    // Jika status bukan COMPLETED, kembalikan status saat ini
    return NextResponse.json({
      success: true,
      status: transaction.status,
      paypalStatus: paypalData.status,
      message: `Current status: ${paypalData.status}`,
    })
  } catch (error: any) {
    console.error("Error checking PayPal status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error checking PayPal status: " + error.message,
      },
      { status: 500 },
    )
  }
}
