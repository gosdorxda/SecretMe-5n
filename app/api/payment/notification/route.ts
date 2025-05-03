import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
// Tambahkan import untuk logger
import { createNotificationLogger } from "@/lib/payment/logger"

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking this notification
  const logger = createNotificationLogger()
  logger.info("PAYMENT NOTIFICATION RECEIVED")

  try {
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    logger.debug("Request headers received", { headers: logger.sanitizeHeaders(headers) })

    // Check content type to determine how to parse the request body
    const contentType = request.headers.get("content-type") || ""
    logger.debug("Content type", { contentType })

    let notificationData: any = {}
    let gatewayName = "duitku" // Default to Duitku
    let eventType = "payment" // Default event type

    // PERBAIKAN: Deteksi gateway berdasarkan header terlebih dahulu
    const userAgent = request.headers.get("user-agent") || ""
    const callbackEvent = request.headers.get("x-callback-event") || ""
    const callbackSignature = request.headers.get("x-callback-signature") || ""

    // Deteksi TriPay berdasarkan header
    if (userAgent.includes("TriPay") || callbackEvent === "payment_status" || callbackSignature) {
      gatewayName = "tripay"
      logger.info("Detected TriPay notification based on headers", {
        userAgent: userAgent.substring(0, 30),
        callbackEvent,
        hasSignature: !!callbackSignature,
      })
    }

    if (contentType.includes("application/json")) {
      // Parse JSON data
      notificationData = await request.json()
      logger.debug("Parsed JSON payload", { payload: logger.sanitizePayload(notificationData) })

      // Deteksi TriPay berdasarkan payload jika belum terdeteksi dari header
      if (gatewayName !== "tripay" && (notificationData.reference || notificationData.merchant_ref)) {
        gatewayName = "tripay"
        logger.info("Detected TriPay notification based on payload structure")

        // Determine event type for TriPay
        if (notificationData.refund_amount || notificationData.event === "refund") {
          eventType = "refund"
          logger.info("Detected TriPay refund event")
        }
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse form data
      const formData = await request.formData()
      // Convert FormData to plain object
      for (const [key, value] of formData.entries()) {
        notificationData[key] = value
      }
      logger.debug("Parsed form data payload", { payload: logger.sanitizePayload(notificationData) })

      // Deteksi TriPay berdasarkan payload jika belum terdeteksi dari header
      if (gatewayName !== "tripay" && (notificationData.reference || notificationData.merchant_ref)) {
        gatewayName = "tripay"
        logger.info("Detected TriPay notification based on payload structure")

        // Determine event type for TriPay
        if (notificationData.refund_amount || notificationData.event === "refund") {
          eventType = "refund"
          logger.info("Detected TriPay refund event")
        }
      }
    } else {
      // Fallback: try to get text and parse it
      const text = await request.text()
      logger.debug("Raw request body", { body: text.substring(0, 1000) + (text.length > 1000 ? "..." : "") })

      try {
        // Try to parse as JSON first
        notificationData = JSON.parse(text)
        logger.debug("Parsed JSON from text", { payload: logger.sanitizePayload(notificationData) })

        // Deteksi TriPay berdasarkan payload jika belum terdeteksi dari header
        if (gatewayName !== "tripay" && (notificationData.reference || notificationData.merchant_ref)) {
          gatewayName = "tripay"
          logger.info("Detected TriPay notification based on payload structure")

          // Determine event type for TriPay
          if (notificationData.refund_amount || notificationData.event === "refund") {
            eventType = "refund"
            logger.info("Detected TriPay refund event")
          }
        }
      } catch (e) {
        // If not JSON, try to parse as URL encoded form data
        const params = new URLSearchParams(text)
        for (const [key, value] of params.entries()) {
          notificationData[key] = value
        }
        logger.debug("Parsed URL params from text", { payload: logger.sanitizePayload(notificationData) })

        // Deteksi TriPay berdasarkan payload jika belum terdeteksi dari header
        if (gatewayName !== "tripay" && (notificationData.reference || notificationData.merchant_ref)) {
          gatewayName = "tripay"
          logger.info("Detected TriPay notification based on payload structure")

          // Determine event type for TriPay
          if (notificationData.refund_amount || notificationData.event === "refund") {
            eventType = "refund"
            logger.info("Detected TriPay refund event")
          }
        }
      }
    }

    // PERBAIKAN: Penanganan khusus untuk test callback
    if (notificationData.note === "Test Callback") {
      logger.info("Detected test callback", { gateway: gatewayName })

      // Jika ini adalah test callback dari TriPay tapi tidak memiliki merchant_ref
      if (gatewayName === "tripay" && (!notificationData.merchant_ref || !notificationData.reference)) {
        logger.info("Test callback missing required fields, using dummy values")

        // Gunakan nilai dummy untuk test callback
        notificationData.merchant_ref = notificationData.merchant_ref || "TEST-CALLBACK-" + Date.now()
        notificationData.reference = notificationData.reference || "TEST-REF-" + Date.now()
      }
    }

    // Determine which gateway to use based on the notification data
    // This could be determined by headers, payload structure, or a query parameter
    logger.info("Payment gateway and event type determined", { gateway: gatewayName, eventType })

    // Get the appropriate payment gateway
    const gateway = await getPaymentGateway(gatewayName)

    // Extract order ID for error handling
    // Different gateways use different field names
    let orderId = "unknown"
    if (gatewayName === "tripay") {
      orderId = notificationData.merchant_ref || notificationData.reference || "unknown"
      logger.debug("TriPay order details", {
        orderId,
        reference: notificationData.reference || "not provided",
      })

      // Add signature from header to the notification data for TriPay
      if (request.headers.get("x-callback-signature")) {
        notificationData.signature = request.headers.get("x-callback-signature")
        logger.debug("Added TriPay signature from header", {
          signature: notificationData.signature
            ? notificationData.signature.substring(0, 4) +
              "****" +
              notificationData.signature.substring(notificationData.signature.length - 4)
            : "not provided",
        })
      }
    } else {
      orderId = notificationData.merchantOrderId || notificationData.order_id || "unknown"
      logger.debug("Duitku order details", { orderId })
    }

    try {
      // Process the notification with the gateway
      logger.info("Processing notification with gateway", { gateway: gatewayName })
      const result = await gateway.handleNotification(notificationData, headers)

      // Extract important data
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

      // Ensure payment details is not null or undefined
      const paymentDetailsToSave = result.details || {}
      logger.debug("Payment details information", {
        type: typeof paymentDetailsToSave,
        isArray: Array.isArray(paymentDetailsToSave),
        isNull: paymentDetailsToSave === null,
        keyCount: Object.keys(paymentDetailsToSave || {}).length,
      })

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

      logger.debug("Payment details being saved", { details: logger.sanitizePayload(result.details) })

      if (updateError) {
        logger.error("Failed to update transaction", updateError, { transactionId: transaction.id })
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
      }

      logger.info("Transaction updated successfully", { transactionId: transaction.id, newStatus })

      // Handle different event types
      if (eventType === "refund") {
        logger.info("Processing refund event", { userId: transaction.user_id })

        // Update user premium status for refund
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            is_premium: false,
            premium_expires_at: null,
          })
          .eq("id", transaction.user_id)

        if (userUpdateError) {
          logger.error("Failed to update user premium status for refund", userUpdateError, {
            userId: transaction.user_id,
          })
          return NextResponse.json({ error: "Failed to update user premium status for refund" }, { status: 500 })
        }

        logger.info("User premium status updated for refund", { userId: transaction.user_id, isPremium: false })
      } else if (isPremium) {
        // Standard payment event that results in premium status
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
          gateway: gatewayName,
          raw_payload: notificationData,
          parsed_payload: result.details,
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
        paymentMethod: result.paymentMethod,
        eventType: eventType,
        transactionId: transaction.id,
        orderId: orderId,
      })

      return NextResponse.json({
        success: true,
        message: `Transaction ${orderId} updated to ${newStatus}`,
        requestId: logger.requestId,
        gateway: gatewayName,
        eventType: eventType,
      })
    } catch (error) {
      logger.error("Error processing notification with gateway", error, { gateway: gatewayName, orderId })

      // Attempt to update transaction status based on notification data directly
      // This is a fallback in case the gateway processing fails
      try {
        logger.info("Attempting fallback processing", { orderId })

        // Determine status from notification data
        let status = "unknown"

        if (gatewayName === "tripay") {
          // TriPay specific fallback
          const tripayStatus = notificationData.status
          logger.debug("TriPay fallback status determination", { rawStatus: tripayStatus })

          if (tripayStatus === "PAID") {
            status = "success"
          } else if (tripayStatus === "UNPAID") {
            status = "pending"
          } else if (tripayStatus === "EXPIRED" || tripayStatus === "FAILED") {
            status = "failed"
          } else if (tripayStatus === "CANCELED") {
            // Tambahkan penanganan khusus untuk CANCELED
            status = "cancelled"
            logger.info("Transaction was cancelled", { tripayStatus, orderId })
          } else if (tripayStatus === "REFUND") {
            status = "refunded"
          }
        } else {
          // Duitku fallback
          const resultCode = notificationData.resultCode
          logger.debug("Duitku fallback status determination", { resultCode })

          if (resultCode === "00" || resultCode === "01") {
            status = "success"
          } else if (resultCode === "02") {
            status = "pending"
          } else {
            status = "failed"
          }
        }

        logger.info("Determined status from notification", { status })

        // Find transaction in database
        const supabase = createClient()
        const { data: transaction, error: findError } = await supabase
          .from("premium_transactions")
          .select("id, user_id, status")
          .eq("plan_id", orderId)
          .single()

        if (findError) {
          logger.error("Transaction not found", findError, { orderId })
          return NextResponse.json({ error: "Transaction not found", order_id: orderId }, { status: 404 })
        }

        // Ensure notification data is not null or undefined
        const paymentDetailsToSave = notificationData || {}
        logger.debug("Fallback payment details information", {
          type: typeof paymentDetailsToSave,
          isArray: Array.isArray(paymentDetailsToSave),
          isNull: paymentDetailsToSave === null,
          keyCount: Object.keys(paymentDetailsToSave || {}).length,
        })

        // Update transaction in database
        logger.info("Updating transaction via fallback", {
          transactionId: transaction.id,
          oldStatus: transaction.status,
          newStatus: status,
        })

        const { error: updateError } = await supabase
          .from("premium_transactions")
          .update({
            status: status,
            payment_method:
              gatewayName === "tripay"
                ? notificationData.payment_method || "unknown"
                : notificationData.paymentCode || "unknown",
            payment_details: notificationData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id)

        logger.debug("Fallback payment details being saved", { details: logger.sanitizePayload(notificationData) })

        if (updateError) {
          logger.error("Failed to update transaction via fallback", updateError, { transactionId: transaction.id })
          return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
        }

        // Handle different event types in fallback
        if (eventType === "refund" || status === "refunded") {
          logger.info("Processing refund event via fallback", { userId: transaction.user_id })

          // Update user premium status for refund
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({
              is_premium: false,
              premium_expires_at: null,
            })
            .eq("id", transaction.user_id)

          if (userUpdateError) {
            logger.error("Failed to update user premium status for refund via fallback", userUpdateError, {
              userId: transaction.user_id,
            })
            return NextResponse.json({ error: "Failed to update user premium status for refund" }, { status: 500 })
          }

          logger.info("User premium status updated for refund via fallback", {
            userId: transaction.user_id,
            isPremium: false,
          })
        } else if (status === "success") {
          // Standard payment event that results in premium status
          logger.info("Upgrading user to premium status via fallback", { userId: transaction.user_id })
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({
              is_premium: true,
              premium_expires_at: null, // Lifetime premium
            })
            .eq("id", transaction.user_id)

          if (userUpdateError) {
            logger.error("Failed to update user premium status via fallback", userUpdateError, {
              userId: transaction.user_id,
            })
            return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
          }

          logger.info("User is now premium via fallback", { userId: transaction.user_id, isPremium: true })
        }

        // Log transaction to payment notification logs table
        try {
          logger.debug("Logging fallback notification to payment_notification_logs table")
          const { error: logError } = await supabase.from("payment_notification_logs").insert({
            request_id: logger.requestId,
            gateway: gatewayName,
            raw_payload: notificationData,
            parsed_payload: null,
            headers: headers,
            status: status,
            error: "Processed via fallback",
            transaction_id: transaction.id,
            order_id: orderId,
            event_type: eventType,
          })

          if (logError) {
            logger.warn("Failed to log notification via fallback, but transaction was processed", logError)
          } else {
            logger.debug("Fallback notification logged successfully")
          }
        } catch (logError) {
          logger.warn("Error logging notification via fallback", logError)
          // Continue processing even if logging fails
        }

        logger.info("Fallback processing completed successfully", {
          transactionId: transaction.id,
          orderId: orderId,
          status: status,
        })

        return NextResponse.json({
          success: true,
          message: `Transaction ${orderId} updated to ${status} (fallback processing)`,
          requestId: logger.requestId,
          gateway: gatewayName,
          eventType: eventType,
        })
      } catch (fallbackError) {
        logger.error("Fallback processing failed", fallbackError, { orderId })
        return NextResponse.json(
          {
            error: "Failed to process notification",
            details: error.message,
            requestId: logger.requestId,
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    logger.error("Unhandled error processing payment notification", error)
    return NextResponse.json({ error: "Internal server error", requestId: logger.requestId }, { status: 500 })
  }
}
