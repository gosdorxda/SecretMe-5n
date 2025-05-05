import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { createNotificationLogger } from "@/lib/payment/logger"

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking this notification
  const logger = createNotificationLogger("paypal")
  logger.info("PAYPAL IPN NOTIFICATION RECEIVED")

  try {
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    logger.debug("Request headers received", { headers: logger.sanitizeHeaders(headers) })

    // Parse the request body as form data (PayPal IPN sends form data)
    const formData = await request.formData()
    const payload = Object.fromEntries(formData.entries())
    logger.debug("Parsed form data payload", { payload: logger.sanitizePayload(payload) })

    // Get the PayPal gateway
    const gateway = await getPaymentGateway("paypal")

    // Process the notification with the gateway
    logger.info("Processing notification with PayPal gateway")
    const result = await gateway.handleNotification(payload, headers)

    // Extract important data
    const orderId = result.orderId
    const paymentStatus = result.status
    const isSuccess = result.isSuccess

    logger.info("Transaction details", {
      orderId,
      status: paymentStatus,
      success: isSuccess,
      paymentMethod: result.paymentMethod,
    })

    // Find transaction in database
    logger.debug("Looking up transaction in database", { orderId })
    const supabase = createClient()
    const { data: transaction, error: findError } = await supabase
      .from("premium_transactions")
      .select("id, user_id, status, payment_gateway")
      .eq("plan_id", orderId)
      .single()

    if (findError) {
      logger.error("Transaction not found", findError, { orderId })
      return NextResponse.json({ error: "Transaction not found", order_id: orderId }, { status: 404 })
    }

    logger.info("Found transaction in database", {
      transactionId: transaction.id,
      userId: transaction.user_id,
      currentStatus: transaction.status,
      gateway: transaction.payment_gateway || "unknown",
    })

    // Determine new status
    let newStatus = transaction.status
    let isPremium = false

    if (paymentStatus === "success") {
      newStatus = "success"
      isPremium = true
      logger.info("Payment successful", { newStatus: "success", isPremium: true })
    } else if (paymentStatus === "failed" || paymentStatus === "expired") {
      newStatus = "failed"
      logger.info("Payment failed or expired", { newStatus: "failed", isPremium: false })
    } else if (paymentStatus === "pending") {
      newStatus = "pending"
      logger.info("Payment pending", { newStatus: "pending", isPremium: false })
    } else if (paymentStatus === "refunded") {
      newStatus = "refunded"
      isPremium = false
      logger.info("Payment refunded", { newStatus: "refunded", isPremium: false })
    }

    // Update transaction in database
    logger.info("Updating transaction status", {
      transactionId: transaction.id,
      oldStatus: transaction.status,
      newStatus: newStatus,
    })

    const { error: updateError } = await supabase
      .from("premium_transactions")
      .update({
        status: newStatus,
        payment_method: result.paymentMethod,
        payment_details: result.details,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    if (updateError) {
      logger.error("Failed to update transaction", updateError, { transactionId: transaction.id })
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
    }

    logger.info("Transaction updated successfully", { transactionId: transaction.id, newStatus })

    // Update user premium status if payment is successful
    if (isPremium) {
      logger.info("Upgrading user to premium status", { userId: transaction.user_id })
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: null, // Lifetime premium
        })
        .eq("id", transaction.user_id)

      if (userUpdateError) {
        logger.error("Failed to update user premium status", userUpdateError, { userId: transaction.user_id })
        return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
      }

      logger.info("User is now premium", { userId: transaction.user_id, isPremium: true })
    }

    // Log transaction to payment notification logs table
    try {
      logger.debug("Logging notification to payment_notification_logs table")
      const { error: logError } = await supabase.from("payment_notification_logs").insert({
        request_id: logger.requestId,
        gateway: "paypal",
        raw_payload: payload,
        parsed_payload: result.details,
        headers: headers,
        status: newStatus,
        transaction_id: transaction.id,
        order_id: orderId,
        event_type: result.eventType,
      })

      if (logError) {
        logger.warn("Failed to log notification, but transaction was processed", logError)
      } else {
        logger.debug("Notification logged successfully")
      }
    } catch (logError) {
      logger.warn("Error logging notification", logError)
      // Continue processing even if logging fails
    }

    logger.info("Notification processing completed successfully", {
      paymentMethod: result.paymentMethod,
      eventType: result.eventType,
      transactionId: transaction.id,
      orderId: orderId,
    })

    // PayPal expects a 200 OK response with the text "VERIFIED" for successful IPN processing
    return new Response("VERIFIED", { status: 200 })
  } catch (error) {
    logger.error("Error processing PayPal notification", error)
    return NextResponse.json({ error: "Internal server error", requestId: logger.requestId }, { status: 500 })
  }
}
