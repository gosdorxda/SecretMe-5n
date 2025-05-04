import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "@/lib/payment/logger"

export async function POST(request: NextRequest) {
  const logger = createPaymentLogger("paypal-webhook")
  logger.info("PayPal webhook received")

  try {
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    logger.debug("Request headers received", { headers })

    // Parse webhook payload
    const payload = await request.json()
    logger.debug("Webhook payload received", { payload })

    // Extract important information from the payload
    const eventType = payload.event_type
    const resourceType = payload.resource_type
    const captureId = payload.resource?.id

    // Extract order ID from different possible locations in the payload
    const orderId =
      payload.resource?.supplementary_data?.related_ids?.order_id ||
      payload.resource?.links
        ?.find((link: any) => link.rel === "up")
        ?.href?.split("/")
        .pop() ||
      ""

    logger.info("Extracted PayPal order ID", {
      orderId,
      captureId,
      eventType: eventType,
    })

    // SELALU log webhook ke payment_notification_logs, bahkan jika ini adalah test webhook
    const supabase = createClient()

    // Log webhook ke payment_notification_logs
    const logEntry = {
      request_id: logger.requestId,
      gateway: "paypal",
      raw_payload: payload,
      headers: headers,
      status: "received",
      order_id: orderId || "unknown",
      event_type: eventType || "unknown",
    }

    await supabase.from("payment_notification_logs").insert(logEntry)
    logger.debug("Webhook logged to payment_notification_logs", { logId: logger.requestId })

    // Check if this is a test webhook
    const isTestWebhook =
      payload.create_time?.startsWith("2015") || // PayPal example webhooks use 2015 date
      payload.summary?.includes("test") ||
      !orderId

    if (isTestWebhook) {
      logger.info("Detected test webhook from PayPal", {
        createTime: payload.create_time,
        summary: payload.summary,
      })

      // Update log entry for test webhook
      await supabase
        .from("payment_notification_logs")
        .update({ status: "test_webhook" })
        .eq("request_id", logger.requestId)

      // Return success for test webhooks
      return NextResponse.json({
        success: true,
        message: "Test webhook received successfully",
        isTest: true,
      })
    }

    // Look up transaction in database
    logger.debug("Looking up transaction in database", {
      orderId,
      eventType,
    })

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
        // Try to find by searching in payment_details
        logger.debug("Transaction not found by plan_id, searching in payment_details", { orderId })

        const { data: transactions, error: searchError } = await supabase
          .from("premium_transactions")
          .select("*")
          .eq("payment_gateway", "paypal")

        if (searchError) {
          logger.error("Error searching transactions", searchError)

          // Update log entry with error
          await supabase
            .from("payment_notification_logs")
            .update({
              status: "error",
              error: "Error searching transactions",
            })
            .eq("request_id", logger.requestId)

          return NextResponse.json({ error: "Error searching transactions" }, { status: 500 })
        }

        // Search for the order ID in payment_details
        const matchingTransaction = transactions.find((t) => {
          if (!t.payment_details) return false

          // Try to find the order ID in payment_details
          const details = typeof t.payment_details === "string" ? JSON.parse(t.payment_details) : t.payment_details

          return (
            details.id === orderId ||
            details.orderId === orderId ||
            details.order_id === orderId ||
            details.gatewayReference === orderId ||
            details.gateway_reference === orderId ||
            details.token === orderId
          )
        })

        if (matchingTransaction) {
          transaction = matchingTransaction
          logger.info("Found transaction by searching payment_details", {
            transactionId: transaction.id,
            userId: transaction.user_id,
          })
        } else {
          logger.error("Transaction not found", { orderId })

          // Update log entry with transaction not found
          await supabase
            .from("payment_notification_logs")
            .update({
              status: "unmatched",
              error: "Transaction not found",
            })
            .eq("request_id", logger.requestId)

          return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
        }
      } else {
        transaction = transactionByPlanId
        logger.info("Found transaction by plan_id", {
          transactionId: transaction.id,
          userId: transaction.user_id,
        })
      }
    } else {
      logger.info("Found transaction by gateway_reference", {
        transactionId: transaction.id,
        userId: transaction.user_id,
      })
    }

    // Update log entry with transaction ID
    await supabase
      .from("payment_notification_logs")
      .update({
        transaction_id: transaction.id,
        status: "processing",
      })
      .eq("request_id", logger.requestId)

    // Process the webhook based on event type
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      logger.info("Processing payment capture completed", {
        transactionId: transaction.id,
        userId: transaction.user_id,
      })

      // Update transaction status
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "success",
          payment_method: "PayPal",
          gateway_reference: orderId, // Pastikan gateway_reference diperbarui
          payment_details: {
            ...transaction.payment_details,
            captureId: captureId,
            eventType: eventType,
            webhookData: payload,
            gateway_reference: orderId,
            processed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction", updateError)

        // Update log entry with error
        await supabase
          .from("payment_notification_logs")
          .update({
            status: "error",
            error: "Failed to update transaction",
          })
          .eq("request_id", logger.requestId)

        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
      }

      // Update user premium status
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: null, // Lifetime premium
        })
        .eq("id", transaction.user_id)

      if (userUpdateError) {
        logger.error("Failed to update user premium status", userUpdateError)

        // Update log entry with error
        await supabase
          .from("payment_notification_logs")
          .update({
            status: "error",
            error: "Failed to update user premium status",
          })
          .eq("request_id", logger.requestId)

        return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
      }

      logger.info("User is now premium", {
        userId: transaction.user_id,
        transactionId: transaction.id,
      })

      // Update log entry with success
      await supabase
        .from("payment_notification_logs")
        .update({
          status: "success",
          parsed_payload: {
            captureId: captureId,
            eventType: eventType,
            status: "success",
          },
        })
        .eq("request_id", logger.requestId)
    } else if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
      logger.info("Processing payment refund", {
        transactionId: transaction.id,
        userId: transaction.user_id,
      })

      // Update transaction status
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "refunded",
          gateway_reference: orderId, // Pastikan gateway_reference diperbarui
          payment_details: {
            ...transaction.payment_details,
            captureId: captureId,
            eventType: eventType,
            webhookData: payload,
            gateway_reference: orderId,
            processed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction", updateError)

        // Update log entry with error
        await supabase
          .from("payment_notification_logs")
          .update({
            status: "error",
            error: "Failed to update transaction",
          })
          .eq("request_id", logger.requestId)

        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
      }

      // Remove user premium status
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: false,
          premium_expires_at: null,
        })
        .eq("id", transaction.user_id)

      if (userUpdateError) {
        logger.error("Failed to update user premium status", userUpdateError)

        // Update log entry with error
        await supabase
          .from("payment_notification_logs")
          .update({
            status: "error",
            error: "Failed to update user premium status",
          })
          .eq("request_id", logger.requestId)

        return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
      }

      logger.info("User premium status removed due to refund", {
        userId: transaction.user_id,
        transactionId: transaction.id,
      })

      // Update log entry with success
      await supabase
        .from("payment_notification_logs")
        .update({
          status: "refunded",
          parsed_payload: {
            captureId: captureId,
            eventType: eventType,
            status: "refunded",
          },
        })
        .eq("request_id", logger.requestId)
    } else if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      logger.info("Processing payment denial/reversal", {
        transactionId: transaction.id,
        userId: transaction.user_id,
      })

      // Update transaction status
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "failed",
          gateway_reference: orderId, // Pastikan gateway_reference diperbarui
          payment_details: {
            ...transaction.payment_details,
            captureId: captureId,
            eventType: eventType,
            webhookData: payload,
            gateway_reference: orderId,
            processed_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction", updateError)

        // Update log entry with error
        await supabase
          .from("payment_notification_logs")
          .update({
            status: "error",
            error: "Failed to update transaction",
          })
          .eq("request_id", logger.requestId)

        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
      }

      logger.info("Transaction marked as failed", {
        transactionId: transaction.id,
        userId: transaction.user_id,
      })

      // Update log entry with success
      await supabase
        .from("payment_notification_logs")
        .update({
          status: "failed",
          parsed_payload: {
            captureId: captureId,
            eventType: eventType,
            status: "failed",
          },
        })
        .eq("request_id", logger.requestId)
    } else {
      // For other event types, just log them
      logger.info("Received other PayPal event type", {
        eventType,
        transactionId: transaction.id,
      })

      // Update log entry with other event type
      await supabase
        .from("payment_notification_logs")
        .update({
          status: "other_event",
          parsed_payload: {
            captureId: captureId,
            eventType: eventType,
          },
        })
        .eq("request_id", logger.requestId)
    }

    logger.info("PayPal webhook processed successfully", {
      transactionId: transaction.id,
      orderId: orderId,
      eventType: eventType,
    })

    return NextResponse.json({
      success: true,
      message: `Webhook processed successfully for transaction ${transaction.id}`,
    })
  } catch (error: any) {
    logger.error("Error processing PayPal webhook", error)

    // Try to log the error
    try {
      const supabase = createClient()
      await supabase.from("payment_notification_logs").insert({
        request_id: logger.requestId,
        gateway: "paypal",
        raw_payload: { error: error.message },
        status: "error",
        event_type: "error",
        error: error.message,
      })
    } catch (logError) {
      logger.error("Failed to log error", logError)
    }

    return NextResponse.json(
      {
        error: "Error processing webhook",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
