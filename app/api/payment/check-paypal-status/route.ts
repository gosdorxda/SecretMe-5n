import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "@/lib/payment/payment-logger"

export async function GET(request: NextRequest) {
  const logger = createPaymentLogger("paypal-check")
  logger.info("Checking PayPal payment status")

  try {
    // Get order ID from query params
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("orderId") || searchParams.get("order_id")

    if (!orderId) {
      logger.error("Missing orderId parameter")
      return NextResponse.json({ success: false, error: "Missing orderId parameter" }, { status: 400 })
    }

    logger.info("Checking PayPal order status", { orderId })

    // Find transaction in database
    const supabase = createClient()

    // First try to find by gateway_reference
    let { data: transaction, error: refError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("gateway_reference", orderId)
      .single()

    // If not found by gateway_reference, try to find by plan_id
    if (refError) {
      logger.debug("Transaction not found by gateway_reference, trying plan_id", { orderId })
      const { data: transactionByPlanId, error: planIdError } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("plan_id", orderId)
        .single()

      if (planIdError) {
        logger.error("Transaction not found", planIdError, { orderId })
        return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
      }

      transaction = transactionByPlanId
      logger.info("Found transaction", {
        transactionId: transaction.id,
        userId: transaction.user_id,
        status: transaction.status,
        gateway: transaction.payment_gateway,
      })
    }

    // Get PayPal order ID from transaction
    let paypalOrderId = transaction.gateway_reference

    // If no gateway_reference, try to extract from payment_details
    if (!paypalOrderId && transaction.payment_details) {
      const details = transaction.payment_details
      paypalOrderId = details.gateway_reference || details.token || details.id
    }

    // If still no PayPal order ID, we need to create one
    if (!paypalOrderId) {
      logger.warn("No PayPal order ID found in transaction", {
        transactionId: transaction.id,
        orderId,
      })

      // Jika tidak ada PayPal order ID, kita perlu memperbarui status berdasarkan waktu
      // Jika transaksi sudah lama (> 30 menit) dan masih pending, anggap gagal
      const createdAt = new Date(transaction.created_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

      if (diffMinutes > 30 && transaction.status === "pending") {
        logger.info("Transaction is old and still pending, marking as failed", {
          transactionId: transaction.id,
          createdAt: transaction.created_at,
          diffMinutes,
        })

        // Update transaction status to failed
        const { error: updateError } = await supabase
          .from("premium_transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
            payment_details: {
              ...transaction.payment_details,
              failed_reason: "Timeout - no PayPal order ID found",
              checked_at: new Date().toISOString(),
            },
          })
          .eq("id", transaction.id)

        if (updateError) {
          logger.error("Failed to update transaction status", updateError)
        }

        return NextResponse.json({
          success: true,
          status: "failed",
          message: "Transaction timed out",
        })
      }

      // Jika belum 30 menit, kembalikan status saat ini
      return NextResponse.json({
        success: true,
        status: transaction.status,
        message: "No PayPal order ID found, please try again later",
      })
    }

    // Periksa status di PayPal
    logger.info("Checking PayPal order status with ID", { paypalOrderId })

    // Dapatkan kredensial PayPal
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      logger.error("Missing PayPal credentials")
      return NextResponse.json({ success: false, error: "Missing PayPal credentials" }, { status: 500 })
    }

    // Dapatkan token akses
    const authResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      logger.error("Failed to get PayPal access token", null, {
        status: authResponse.status,
        response: errorText,
      })
      return NextResponse.json(
        { success: false, error: `Failed to get PayPal access token: ${authResponse.status}` },
        { status: 500 },
      )
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Periksa status order
    const orderResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // Jika order tidak ditemukan, coba perbarui gateway_reference
    if (orderResponse.status === 404) {
      logger.warn("PayPal order not found, order ID may be invalid", { paypalOrderId })

      // Jika transaksi sudah lama (> 30 menit) dan masih pending, anggap gagal
      const createdAt = new Date(transaction.created_at)
      const now = new Date()
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

      if (diffMinutes > 30 && transaction.status === "pending") {
        logger.info("Transaction is old and still pending, marking as failed", {
          transactionId: transaction.id,
          createdAt: transaction.created_at,
          diffMinutes,
        })

        // Update transaction status to failed
        const { error: updateError } = await supabase
          .from("premium_transactions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
            payment_details: {
              ...transaction.payment_details,
              failed_reason: "PayPal order not found",
              checked_at: new Date().toISOString(),
            },
          })
          .eq("id", transaction.id)

        if (updateError) {
          logger.error("Failed to update transaction status", updateError)
        }

        return NextResponse.json({
          success: true,
          status: "failed",
          message: "PayPal order not found",
        })
      }

      // Jika belum 30 menit, kembalikan status saat ini
      return NextResponse.json({
        success: true,
        status: transaction.status,
        message: "PayPal order not found, please try again later",
      })
    }

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      logger.error("Failed to check PayPal order status", null, {
        status: orderResponse.status,
        response: errorText,
      })
      return NextResponse.json(
        { success: false, error: `Failed to check PayPal order status: ${orderResponse.status}` },
        { status: 500 },
      )
    }

    const orderData = await orderResponse.json()
    logger.info("PayPal order status retrieved", {
      paypalOrderId,
      status: orderData.status,
    })

    // Map PayPal status to our status
    let newStatus = transaction.status
    let isPremium = false

    if (orderData.status === "COMPLETED" || orderData.status === "APPROVED") {
      newStatus = "success"
      isPremium = true
    } else if (orderData.status === "VOIDED" || orderData.status === "CANCELLED") {
      newStatus = "failed"
    }

    // Update transaction if status changed
    if (newStatus !== transaction.status) {
      logger.info("Updating transaction status", {
        transactionId: transaction.id,
        oldStatus: transaction.status,
        newStatus,
      })

      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: newStatus,
          gateway_reference: paypalOrderId, // Pastikan gateway_reference diperbarui
          payment_details: {
            ...transaction.payment_details,
            paypalStatus: orderData.status,
            paypalOrderId: paypalOrderId,
            details: orderData,
            checked_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction", updateError)
        return NextResponse.json({ success: false, error: "Failed to update transaction" }, { status: 500 })
      }

      // Update user premium status if payment successful
      if (isPremium) {
        logger.info("Updating user premium status", {
          userId: transaction.user_id,
          isPremium,
        })

        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            is_premium: true,
            premium_expires_at: null, // Lifetime premium
          })
          .eq("id", transaction.user_id)

        if (userUpdateError) {
          logger.error("Failed to update user premium status", userUpdateError)
          return NextResponse.json({ success: false, error: "Failed to update user premium status" }, { status: 500 })
        }

        logger.info("User is now premium", { userId: transaction.user_id })
      }
    } else {
      logger.info("Transaction status unchanged", {
        transactionId: transaction.id,
        status: transaction.status,
      })

      // Perbarui payment_details meskipun status tidak berubah
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          gateway_reference: paypalOrderId, // Pastikan gateway_reference diperbarui
          payment_details: {
            ...transaction.payment_details,
            paypalStatus: orderData.status,
            paypalOrderId: paypalOrderId,
            details: orderData,
            checked_at: new Date().toISOString(),
          },
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.warn("Failed to update payment details", updateError)
      }
    }

    // Log ke payment_notification_logs
    try {
      await supabase.from("payment_notification_logs").insert({
        gateway: "paypal",
        raw_payload: orderData,
        headers: {},
        status: newStatus,
        transaction_id: transaction.id,
        order_id: paypalOrderId,
        event_type: "check-status",
      })
    } catch (logError) {
      logger.warn("Failed to log to payment_notification_logs", logError)
    }

    // Return current status
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: newStatus,
        paypalStatus: orderData.status,
        paypalOrderId: paypalOrderId,
      },
      isPremium,
    })
  } catch (error: any) {
    console.error("Error checking PayPal status:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
