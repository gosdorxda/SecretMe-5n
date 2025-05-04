import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { createNotificationLogger } from "@/lib/payment/logger"

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking this notification
  const logger = createNotificationLogger()
  logger.info("PAYPAL WEBHOOK RECEIVED")

  try {
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    logger.debug("Request headers received", { headers: logger.sanitizeHeaders(headers) })

    // Parse the request body
    const payload = await request.json()
    logger.debug("Parsed JSON payload", { payload: logger.sanitizePayload(payload) })

    // Get the PayPal gateway
    const gateway = await getPaymentGateway("paypal")

    // Extract important data from the webhook payload
    const eventType = payload.event_type

    // For PAYMENT.CAPTURE.COMPLETED events, we need to extract the order_id from supplementary_data
    let orderId = ""
    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && payload.resource) {
      // Try to get the order_id from supplementary_data
      orderId = payload.resource.supplementary_data?.related_ids?.order_id || ""

      // If we couldn't find the order_id, try to get it from links
      if (!orderId) {
        // Try to extract order ID from links
        const orderLink = payload.resource.links?.find(
          (link: any) => link.rel === "up" && link.href.includes("/orders/"),
        )
        if (orderLink) {
          const parts = orderLink.href.split("/")
          orderId = parts[parts.length - 1]
        }
      }

      // If we still don't have an order ID, use the reference_id or custom_id if available
      if (!orderId) {
        orderId = payload.resource.custom_id || payload.resource.invoice_id || payload.resource.id
      }

      logger.info("Extracted PayPal order ID", {
        orderId,
        captureId: payload.resource.id,
        eventType,
      })
    } else {
      // For other event types, use the resource ID directly
      orderId = payload.resource?.id || ""
    }

    if (!orderId) {
      logger.error("Could not extract order ID from PayPal webhook", null, { payload: logger.sanitizePayload(payload) })
      return NextResponse.json({ error: "Could not extract order ID from webhook" }, { status: 400 })
    }

    // Find transaction in database using the extracted order ID
    logger.debug("Looking up transaction in database", { orderId, eventType })
    const supabase = createClient()

    // First try to find by gateway_reference (which should contain the PayPal order ID)
    let { data: transaction, error: findError } = await supabase
      .from("premium_transactions")
      .select("id, user_id, status, payment_gateway, plan_id")
      .eq("gateway_reference", orderId)
      .single()

    // If not found by gateway_reference, try by plan_id
    if (findError) {
      logger.debug("Transaction not found by gateway_reference, trying plan_id", { orderId })
      const { data: transactionByPlanId, error: findByPlanIdError } = await supabase
        .from("premium_transactions")
        .select("id, user_id, status, payment_gateway, plan_id")
        .eq("plan_id", orderId)
        .single()

      if (findByPlanIdError) {
        logger.error("Transaction not found", findByPlanIdError, { orderId })

        // Log the webhook anyway for debugging purposes
        try {
          await supabase.from("payment_notification_logs").insert({
            request_id: logger.requestId,
            gateway: "paypal",
            raw_payload: payload,
            parsed_payload: { orderId, eventType },
            headers: headers,
            status: "unknown",
            order_id: orderId,
            event_type: eventType,
            error_message: "Transaction not found in database",
          })
        } catch (logError) {
          logger.warn("Error logging notification", logError)
        }

        return NextResponse.json({ error: "Transaction not found", order_id: orderId }, { status: 404 })
      }

      transaction = transactionByPlanId
    }

    logger.info("Found transaction in database", {
      transactionId: transaction.id,
      userId: transaction.user_id,
      currentStatus: transaction.status,
      gateway: transaction.payment_gateway || "unknown",
      planId: transaction.plan_id,
    })

    // Determine new status based on event type
    let newStatus = transaction.status
    let isPremium = false

    if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED") {
      newStatus = "success"
      isPremium = true
      logger.info("Payment successful", { newStatus: "success", isPremium: true })
    } else if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      newStatus = "failed"
      logger.info("Payment failed", { newStatus: "failed", isPremium: false })
    } else if (eventType === "PAYMENT.CAPTURE.PENDING") {
      newStatus = "pending"
      logger.info("Payment pending", { newStatus: "pending", isPremium: false })
    } else if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
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
        payment_method: "PayPal",
        payment_details: payload,
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
        parsed_payload: { orderId, eventType, captureId: payload.resource?.id },
        headers: headers,
        status: newStatus,
        transaction_id: transaction.id,
        order_id: orderId,
        event_type: eventType,
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
      paymentMethod: "PayPal",
      eventType: eventType,
      transactionId: transaction.id,
      orderId: orderId,
    })

    return NextResponse.json({
      success: true,
      message: `Transaction ${orderId} updated to ${newStatus}`,
      requestId: logger.requestId,
      gateway: "paypal",
      eventType: eventType,
    })
  } catch (error: any) {
    logger.error("Error processing PayPal webhook", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        requestId: logger.requestId,
      },
      { status: 500 },
    )
  }
}
