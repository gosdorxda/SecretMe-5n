import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { createPaymentLogger } from "@/lib/payment/logger"

export async function GET(request: NextRequest) {
  const logger = createPaymentLogger("paypal-check")
  logger.info("Checking PayPal payment status")

  try {
    // Get order ID from query params
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    if (!orderId) {
      logger.error("No order ID provided")
      return NextResponse.json({ error: "No order ID provided" }, { status: 400 })
    }

    logger.info("Checking PayPal order status", { orderId })

    // Find transaction in database
    const supabase = createClient()

    // First try to find by gateway_reference
    let { data: transaction, error } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("gateway_reference", orderId)
      .single()

    // If not found, try to find by plan_id
    if (error) {
      logger.debug("Transaction not found by gateway_reference, trying plan_id", { orderId })

      const { data: transactionByPlanId, error: planIdError } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("plan_id", orderId)
        .single()

      if (planIdError) {
        logger.error("Transaction not found", planIdError, { orderId })
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      transaction = transactionByPlanId
    }

    logger.info("Found transaction", {
      transactionId: transaction.id,
      userId: transaction.user_id,
      status: transaction.status,
      gateway: transaction.payment_gateway,
    })

    // Get PayPal order ID from transaction
    let paypalOrderId = transaction.gateway_reference

    // If no gateway_reference, try to extract from payment_details
    if (!paypalOrderId && transaction.payment_details) {
      const details =
        typeof transaction.payment_details === "string"
          ? JSON.parse(transaction.payment_details)
          : transaction.payment_details

      paypalOrderId = details?.gateway_reference || details?.token || details?.id

      logger.debug("Extracted PayPal order ID from payment_details", {
        paypalOrderId,
        detailsType: typeof details,
        hasDetails: !!details,
      })
    }

    // If still no PayPal order ID, we need to handle this case
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

      // Log aktivitas ke payment_notification_logs
      await supabase.from("payment_notification_logs").insert({
        request_id: logger.requestId,
        gateway: "paypal",
        raw_payload: {
          action: "check-status",
          orderId: orderId,
          transactionId: transaction.id,
          status: transaction.status,
          createdAt: transaction.created_at,
          diffMinutes,
        },
        status: transaction.status,
        transaction_id: transaction.id,
        order_id: orderId,
        event_type: "status-check",
        error: "No PayPal order ID found",
      })

      if (diffMinutes > 30 && transaction.status === "pending") {
        // Update transaction status to failed due to timeout
        const { error: updateError } = await supabase
          .from("premium_transactions")
          .update({
            status: "failed",
            payment_details: {
              ...transaction.payment_details,
              timeout: true,
              checked_at: new Date().toISOString(),
              error: "Transaction timed out - no PayPal order ID found",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        if (updateError) {
          logger.error("Failed to update transaction status", updateError)
          return NextResponse.json({ error: "Failed to update transaction status" }, { status: 500 })
        }

        logger.info("Transaction marked as failed due to timeout", {
          transactionId: transaction.id,
          diffMinutes,
        })

        return NextResponse.json({
          success: true,
          status: "failed",
          message: "Transaction timed out - no PayPal order ID found",
        })
      }

      // Return current status if not timed out
      return NextResponse.json({
        success: true,
        status: transaction.status,
        message: "No PayPal order ID found, returning current status",
      })
    }

    // Get PayPal gateway
    const paypalGateway = await getPaymentGateway("paypal")

    // Check order status with PayPal
    const result = await paypalGateway.checkOrderStatus(paypalOrderId)

    if (!result.success) {
      logger.error("Failed to check PayPal order status", null, {
        error: result.error,
        paypalOrderId,
      })

      // Log aktivitas ke payment_notification_logs
      await supabase.from("payment_notification_logs").insert({
        request_id: logger.requestId,
        gateway: "paypal",
        raw_payload: {
          action: "check-status",
          orderId: orderId,
          paypalOrderId: paypalOrderId,
          error: result.error,
        },
        status: "error",
        transaction_id: transaction.id,
        order_id: orderId,
        event_type: "status-check",
        error: result.error,
      })

      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    logger.info("PayPal order status", {
      paypalOrderId,
      status: result.status,
      details: result.details?.status,
    })

    // Determine new status based on PayPal status
    let newStatus = transaction.status
    let isPremium = false

    if (result.status === "COMPLETED" || result.status === "APPROVED") {
      newStatus = "success"
      isPremium = true
    } else if (result.status === "VOIDED" || result.status === "CANCELLED") {
      newStatus = "failed"
    }

    // Log aktivitas ke payment_notification_logs
    await supabase.from("payment_notification_logs").insert({
      request_id: logger.requestId,
      gateway: "paypal",
      raw_payload: {
        action: "check-status",
        orderId: orderId,
        paypalOrderId: paypalOrderId,
        paypalStatus: result.status,
      },
      parsed_payload: result.details,
      status: newStatus,
      transaction_id: transaction.id,
      order_id: orderId,
      event_type: "status-check",
    })

    // Update transaction if status changed
    if (newStatus !== transaction.status) {
      logger.info("Updating transaction status", {
        transactionId: transaction.id,
        oldStatus: transaction.status,
        newStatus: newStatus,
      })

      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: newStatus,
          gateway_reference: paypalOrderId, // Pastikan gateway_reference diperbarui
          payment_details: {
            ...transaction.payment_details,
            paypal_status: result.status,
            checked_at: new Date().toISOString(),
            details: result.details,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction status", updateError)
        return NextResponse.json({ error: "Failed to update transaction status" }, { status: 500 })
      }

      // Update user premium status if payment successful
      if (isPremium) {
        logger.info("Updating user premium status", { userId: transaction.user_id })

        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            is_premium: true,
            premium_expires_at: null, // Lifetime premium
          })
          .eq("id", transaction.user_id)

        if (userUpdateError) {
          logger.error("Failed to update user premium status", userUpdateError)
          return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
        }

        logger.info("User is now premium", { userId: transaction.user_id })
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      paypalStatus: result.status,
      details: result.details,
    })
  } catch (error: any) {
    logger.error("Error checking PayPal payment status", error)

    // Try to log the error
    try {
      const supabase = createClient()
      await supabase.from("payment_notification_logs").insert({
        request_id: logger.requestId,
        gateway: "paypal",
        raw_payload: { error: error.message },
        status: "error",
        event_type: "status-check-error",
        error: error.message,
      })
    } catch (logError) {
      logger.error("Failed to log error", logError)
    }

    return NextResponse.json(
      {
        error: "Error checking PayPal payment status",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
