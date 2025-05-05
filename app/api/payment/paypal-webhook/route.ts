import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "@/lib/payment/logger"
import { verifyPayPalWebhookSignature } from "@/lib/payment/paypal-webhook-verifier"
import { checkForFraud } from "@/lib/payment/fraud-detector"
import { sendAdminAlert } from "@/lib/notifications/admin-alerts"

export async function POST(request: NextRequest) {
  const requestId = `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const logger = createPaymentLogger("paypal-webhook", requestId)
  logger.info("PayPal webhook received")

  try {
    // Clone request for multiple reads
    const clonedRequest = request.clone()

    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    logger.debug("Request headers received", { headers })

    // Get raw request body as text for signature verification
    const rawBody = await clonedRequest.text()

    // Parse webhook payload for logging
    let payload
    try {
      payload = JSON.parse(rawBody)
      logger.debug("Webhook payload received", {
        event_type: payload.event_type,
        resource_type: payload.resource_type,
        resource_id: payload.resource?.id,
      })
    } catch (error) {
      logger.error("Failed to parse webhook payload", error)
      payload = { error: "Invalid JSON" }
    }

    // Verify webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || ""
    if (!webhookId) {
      logger.error("PAYPAL_WEBHOOK_ID environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const isSignatureValid = await verifyPayPalWebhookSignature(rawBody, headers, webhookId)

    // SELALU log webhook ke payment_notification_logs, bahkan jika ini adalah test webhook
    const supabase = createClient()

    // Log webhook ke payment_notification_logs
    const logEntry = {
      request_id: logger.requestId,
      gateway: "paypal",
      raw_payload: payload,
      headers: headers,
      status: "received",
      order_id: payload.resource?.id || "unknown",
      event_type: payload.event_type || "unknown",
      signature_valid: isSignatureValid,
    }

    await supabase.from("payment_notification_logs").insert(logEntry)
    logger.debug("Webhook logged to payment_notification_logs", { logId: logger.requestId })

    if (!isSignatureValid) {
      logger.error("Invalid PayPal webhook signature")

      // Log invalid webhook attempt
      await supabase
        .from("payment_notification_logs")
        .update({
          status: "invalid_signature",
          event_type: "security_alert",
        })
        .eq("request_id", logger.requestId)

      // Di development mode, kita tetap proses webhook meskipun signature tidak valid
      if (process.env.NODE_ENV !== "production") {
        logger.warn("DEVELOPMENT MODE: Processing webhook despite invalid signature")
      } else {
        // Di production, kita reject webhook dengan signature tidak valid
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

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

    // Update log entry with order ID
    await supabase
      .from("payment_notification_logs")
      .update({
        order_id: orderId || "unknown",
      })
      .eq("request_id", logger.requestId)

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

    // Verify payment amount if it's a payment capture event
    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && transaction) {
      const capturedAmount = payload.resource?.amount?.value
      const capturedCurrency = payload.resource?.amount?.currency_code

      // Verify payment amount (convert IDR to USD for comparison)
      const expectedAmountUSD = (transaction.amount / 15000).toFixed(2)

      if (capturedCurrency !== "USD") {
        logger.warn("Unexpected currency in PayPal capture", {
          expected: "USD",
          received: capturedCurrency,
        })

        // Continue processing but log the discrepancy
      }

      if (capturedAmount && Number.parseFloat(capturedAmount) < Number.parseFloat(expectedAmountUSD) * 0.95) {
        // Amount is significantly less than expected (allowing 5% tolerance for exchange rate fluctuations)
        logger.error("PayPal payment amount mismatch", {
          expected: expectedAmountUSD,
          received: capturedAmount,
          transactionId: transaction.id,
        })

        // Update log entry with error
        await supabase
          .from("payment_notification_logs")
          .update({
            status: "amount_mismatch",
            error: `Amount mismatch: expected ~${expectedAmountUSD} USD, got ${capturedAmount} ${capturedCurrency}`,
          })
          .eq("request_id", logger.requestId)

        // Still process the payment but flag it for review
        await supabase
          .from("premium_transactions")
          .update({
            status: "review",
            payment_details: {
              ...transaction.payment_details,
              captureId: captureId,
              eventType: eventType,
              webhookData: payload,
              gateway_reference: orderId,
              processed_at: new Date().toISOString(),
              review_reason: "amount_mismatch",
              expected_amount_usd: expectedAmountUSD,
              received_amount: capturedAmount,
              received_currency: capturedCurrency,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        return NextResponse.json({
          success: true,
          message: "Payment flagged for review due to amount mismatch",
        })
      }
    }

    // Check for duplicate webhook events
    if (eventType === "PAYMENT.CAPTURE.COMPLETED" && transaction && transaction.status === "success") {
      logger.warn("Duplicate PayPal webhook event received", {
        transactionId: transaction.id,
        currentStatus: transaction.status,
        eventType,
      })

      // Update log entry with duplicate status
      await supabase
        .from("payment_notification_logs")
        .update({
          status: "duplicate",
          parsed_payload: {
            captureId: captureId,
            eventType: eventType,
            status: "duplicate",
          },
        })
        .eq("request_id", logger.requestId)

      return NextResponse.json({
        success: true,
        message: "Duplicate webhook event ignored",
      })
    }

    // Process the webhook based on event type
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      logger.info("Processing payment capture completed", {
        transactionId: transaction.id,
        userId: transaction.user_id,
      })

      // Check for potential fraud
      const fraudCheck = await checkForFraud(transaction.user_id, transaction.id, {
        ...transaction.payment_details,
        amount: transaction.amount,
        gateway: "paypal",
      })

      if (fraudCheck.isSuspicious && fraudCheck.riskLevel === "high") {
        logger.warn("High risk transaction detected", {
          transactionId: transaction.id,
          userId: transaction.user_id,
          reasons: fraudCheck.reasons,
        })

        // Flag transaction for review
        const { error: updateError } = await supabase
          .from("premium_transactions")
          .update({
            status: "review",
            payment_details: {
              ...transaction.payment_details,
              captureId: captureId,
              eventType: eventType,
              webhookData: payload,
              gateway_reference: orderId,
              processed_at: new Date().toISOString(),
              fraud_check: fraudCheck,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        // Send alert to admin
        await sendAdminAlert({
          title: "High Risk PayPal Transaction",
          message: `Transaction ${transaction.id} flagged as high risk`,
          data: {
            transactionId: transaction.id,
            userId: transaction.user_id,
            reasons: fraudCheck.reasons,
            orderId,
          },
          level: "warning",
        })

        // Update log entry
        await supabase
          .from("payment_notification_logs")
          .update({
            status: "fraud_review",
            parsed_payload: {
              captureId: captureId,
              eventType: eventType,
              status: "review",
              fraud_check: fraudCheck,
            },
          })
          .eq("request_id", logger.requestId)

        return NextResponse.json({
          success: true,
          message: "Payment flagged for review due to fraud risk",
        })
      }

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
            fraud_check: fraudCheck,
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
