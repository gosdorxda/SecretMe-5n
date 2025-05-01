import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking this notification
  const requestId = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  console.log(`[${requestId}] 🔔 PAYMENT NOTIFICATION RECEIVED`)

  try {
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log(`[${requestId}] 📋 Headers:`, JSON.stringify(headers))

    // Check content type to determine how to parse the request body
    const contentType = request.headers.get("content-type") || ""

    let notificationData: any = {}
    let gatewayName = "duitku" // Default to Duitku

    if (contentType.includes("application/json")) {
      // Parse JSON data
      notificationData = await request.json()
      console.log(`[${requestId}] 📦 Parsed JSON payload:`, JSON.stringify(notificationData))

      // Try to determine if this is a TriPay notification
      if (notificationData.reference || notificationData.merchant_ref) {
        gatewayName = "tripay"
        console.log(`[${requestId}] 🔍 Detected TriPay notification based on payload structure`)
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse form data
      const formData = await request.formData()
      // Convert FormData to plain object
      for (const [key, value] of formData.entries()) {
        notificationData[key] = value
      }
      console.log(`[${requestId}] 📦 Parsed form data payload:`, JSON.stringify(notificationData))

      // Try to determine if this is a TriPay notification
      if (notificationData.reference || notificationData.merchant_ref) {
        gatewayName = "tripay"
        console.log(`[${requestId}] 🔍 Detected TriPay notification based on payload structure`)
      }
    } else {
      // Fallback: try to get text and parse it
      const text = await request.text()
      console.log(`[${requestId}] 📝 Raw request body:`, text)

      try {
        // Try to parse as JSON first
        notificationData = JSON.parse(text)
        console.log(`[${requestId}] 📦 Parsed JSON from text:`, JSON.stringify(notificationData))

        // Try to determine if this is a TriPay notification
        if (notificationData.reference || notificationData.merchant_ref) {
          gatewayName = "tripay"
          console.log(`[${requestId}] 🔍 Detected TriPay notification based on payload structure`)
        }
      } catch (e) {
        // If not JSON, try to parse as URL encoded form data
        const params = new URLSearchParams(text)
        for (const [key, value] of params.entries()) {
          notificationData[key] = value
        }
        console.log(`[${requestId}] 📦 Parsed URL params from text:`, JSON.stringify(notificationData))

        // Try to determine if this is a TriPay notification
        if (notificationData.reference || notificationData.merchant_ref) {
          gatewayName = "tripay"
          console.log(`[${requestId}] 🔍 Detected TriPay notification based on payload structure`)
        }
      }
    }

    // Determine which gateway to use based on the notification data
    // This could be determined by headers, payload structure, or a query parameter
    console.log(`[${requestId}] 🔄 Using payment gateway: ${gatewayName}`)

    // Get the appropriate payment gateway
    const gateway = await getPaymentGateway(gatewayName)

    // Extract order ID for error handling
    // Different gateways use different field names
    let orderId = "unknown"
    if (gatewayName === "tripay") {
      orderId = notificationData.merchant_ref || notificationData.reference || "unknown"
      console.log(`[${requestId}] 🔑 TriPay order ID (merchant_ref): ${orderId}`)
      console.log(`[${requestId}] 🔑 TriPay reference: ${notificationData.reference || "not provided"}`)
    } else {
      orderId = notificationData.merchantOrderId || notificationData.order_id || "unknown"
      console.log(`[${requestId}] 🔑 Duitku order ID: ${orderId}`)
    }

    try {
      // Process the notification with the gateway
      console.log(`[${requestId}] ⚙️ Processing notification with ${gatewayName} gateway`)
      const result = await gateway.handleNotification(notificationData)

      // Extract important data
      const paymentStatus = result.status
      const isSuccess = result.isSuccess

      console.log(
        `[${requestId}] 🧾 Transaction details - OrderID: ${orderId}, Status: ${paymentStatus}, Success: ${isSuccess}`,
      )

      // Find transaction in database
      console.log(`[${requestId}] 🔍 Looking up transaction in database for order_id: ${orderId}`)
      const supabase = createClient()
      const { data: transaction, error: findError } = await supabase
        .from("premium_transactions")
        .select("id, user_id, status, payment_gateway")
        .eq("plan_id", orderId)
        .single()

      if (findError) {
        console.error(`[${requestId}] ❌ Transaction not found for order_id ${orderId}:`, findError)
        return NextResponse.json({ error: "Transaction not found", order_id: orderId }, { status: 404 })
      }

      console.log(
        `[${requestId}] ✅ Found transaction in database: ID=${transaction.id}, UserID=${transaction.user_id}, CurrentStatus=${transaction.status}, Gateway=${transaction.payment_gateway || "unknown"}`,
      )

      // Determine new status
      let newStatus = transaction.status
      let isPremium = false

      if (paymentStatus === "success") {
        newStatus = "success"
        isPremium = true
        console.log(`[${requestId}] 🎉 Payment successful! Setting status to 'success'`)
      } else if (paymentStatus === "failed" || paymentStatus === "expired") {
        newStatus = "failed"
        console.log(`[${requestId}] ❌ Payment failed or expired. Setting status to 'failed'`)
      } else if (paymentStatus === "pending") {
        newStatus = "pending"
        console.log(`[${requestId}] ⏳ Payment pending. Status remains 'pending'`)
      }

      // Ensure payment details is not null or undefined
      const paymentDetailsToSave = result.details || {}
      console.log(
        `[${requestId}] 🔍 Payment details type:`,
        typeof paymentDetailsToSave,
        "Is array:",
        Array.isArray(paymentDetailsToSave),
        "Is null:",
        paymentDetailsToSave === null,
        "Keys:",
        Object.keys(paymentDetailsToSave || {}).length,
      )

      // Update transaction in database
      console.log(
        `[${requestId}] 📝 Updating transaction ${transaction.id} status from '${transaction.status}' to '${newStatus}'`,
      )
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: newStatus,
          payment_method: result.paymentMethod,
          payment_details: result.details,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      console.log(`[${requestId}] 📊 Payment details being saved:`, JSON.stringify(result.details))

      if (updateError) {
        console.error(`[${requestId}] ❌ Failed to update transaction:`, updateError)
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
      }

      console.log(`[${requestId}] ✅ Transaction updated successfully`)

      // Update user premium status if payment is successful
      if (isPremium) {
        console.log(`[${requestId}] 🌟 Upgrading user ${transaction.user_id} to premium status`)
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            is_premium: true,
            premium_expires_at: null, // Lifetime premium
          })
          .eq("id", transaction.user_id)

        if (userUpdateError) {
          console.error(`[${requestId}] ❌ Failed to update user premium status:`, userUpdateError)
          return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
        }

        console.log(`[${requestId}] 🎊 User ${transaction.user_id} is now premium!`)
      }

      // Log transaction to payment notification logs table
      try {
        console.log(`[${requestId}] 📝 Logging notification to payment_notification_logs table`)
        const { error: logError } = await supabase.from("payment_notification_logs").insert({
          request_id: requestId,
          gateway: gatewayName,
          raw_payload: notificationData,
          parsed_payload: result.details,
          headers: headers,
          status: newStatus,
          transaction_id: transaction.id,
          order_id: orderId,
        })

        if (logError) {
          console.error(`[${requestId}] ⚠️ Failed to log notification, but transaction was processed:`, logError)
        } else {
          console.log(`[${requestId}] ✅ Notification logged successfully`)
        }
      } catch (logError) {
        console.error(`[${requestId}] ⚠️ Error logging notification:`, logError)
        // Continue processing even if logging fails
      }

      console.log(
        `[${requestId}] ✅ Notification processing completed successfully. Payment Method: ${result.paymentMethod}`,
      )
      return NextResponse.json({
        success: true,
        message: `Transaction ${orderId} updated to ${newStatus}`,
        requestId: requestId,
        gateway: gatewayName,
      })
    } catch (error) {
      console.error(`[${requestId}] ❌ Error processing notification with gateway:`, error)

      // Attempt to update transaction status based on notification data directly
      // This is a fallback in case the gateway processing fails
      try {
        console.log(`[${requestId}] 🔄 Attempting fallback processing for order ID: ${orderId}`)

        // Determine status from notification data
        let status = "unknown"

        if (gatewayName === "tripay") {
          // TriPay specific fallback
          const tripayStatus = notificationData.status
          console.log(`[${requestId}] 🔍 TriPay fallback - Raw status: ${tripayStatus}`)

          if (tripayStatus === "PAID") {
            status = "success"
          } else if (tripayStatus === "UNPAID") {
            status = "pending"
          } else if (tripayStatus === "EXPIRED" || tripayStatus === "FAILED" || tripayStatus === "CANCELED") {
            status = "failed"
          }
        } else {
          // Duitku fallback
          const resultCode = notificationData.resultCode
          console.log(`[${requestId}] 🔍 Duitku fallback - Result code: ${resultCode}`)

          if (resultCode === "00" || resultCode === "01") {
            status = "success"
          } else if (resultCode === "02") {
            status = "pending"
          } else {
            status = "failed"
          }
        }

        console.log(`[${requestId}] 📊 Determined status from notification: ${status}`)

        // Find transaction in database
        const supabase = createClient()
        const { data: transaction, error: findError } = await supabase
          .from("premium_transactions")
          .select("id, user_id, status")
          .eq("plan_id", orderId)
          .single()

        if (findError) {
          console.error(`[${requestId}] ❌ Transaction not found for order_id ${orderId}:`, findError)
          return NextResponse.json({ error: "Transaction not found", order_id: orderId }, { status: 404 })
        }

        // Ensure notification data is not null or undefined
        const paymentDetailsToSave = notificationData || {}
        console.log(
          `[${requestId}] 🔍 Fallback payment details type:`,
          typeof paymentDetailsToSave,
          "Is array:",
          Array.isArray(paymentDetailsToSave),
          "Is null:",
          paymentDetailsToSave === null,
          "Keys:",
          Object.keys(paymentDetailsToSave || {}).length,
        )

        // Update transaction in database
        console.log(`[${requestId}] 📝 Updating transaction ${transaction.id} status to '${status}'`)
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

        console.log(`[${requestId}] 📊 Fallback payment details being saved:`, JSON.stringify(notificationData))

        if (updateError) {
          console.error(`[${requestId}] ❌ Failed to update transaction:`, updateError)
          return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
        }

        // Update user premium status if payment is successful
        if (status === "success") {
          console.log(`[${requestId}] 🌟 Upgrading user ${transaction.user_id} to premium status`)
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({
              is_premium: true,
              premium_expires_at: null, // Lifetime premium
            })
            .eq("id", transaction.user_id)

          if (userUpdateError) {
            console.error(`[${requestId}] ❌ Failed to update user premium status:`, userUpdateError)
            return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
          }

          console.log(`[${requestId}] 🎊 User ${transaction.user_id} is now premium!`)
        }

        // Log transaction to payment notification logs table
        try {
          console.log(`[${requestId}] 📝 Logging fallback notification to payment_notification_logs table`)
          const { error: logError } = await supabase.from("payment_notification_logs").insert({
            request_id: requestId,
            gateway: gatewayName,
            raw_payload: notificationData,
            parsed_payload: null,
            headers: headers,
            status: status,
            error: "Processed via fallback",
            transaction_id: transaction.id,
            order_id: orderId,
          })

          if (logError) {
            console.error(`[${requestId}] ⚠️ Failed to log notification, but transaction was processed:`, logError)
          } else {
            console.log(`[${requestId}] ✅ Fallback notification logged successfully`)
          }
        } catch (logError) {
          console.error(`[${requestId}] ⚠️ Error logging notification:`, logError)
          // Continue processing even if logging fails
        }

        console.log(`[${requestId}] ✅ Fallback processing completed successfully`)
        return NextResponse.json({
          success: true,
          message: `Transaction ${orderId} updated to ${status} (fallback processing)`,
          requestId: requestId,
          gateway: gatewayName,
        })
      } catch (fallbackError) {
        console.error(`[${requestId}] 💥 Fallback processing failed:`, fallbackError)
        return NextResponse.json(
          {
            error: "Failed to process notification",
            details: error.message,
            requestId: requestId,
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error(`[${requestId}] 💥 Unhandled error processing payment notification:`, error)
    return NextResponse.json({ error: "Internal server error", requestId: requestId }, { status: 500 })
  }
}
