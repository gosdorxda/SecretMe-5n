import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "@/lib/payment/payment-logger"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"

export async function GET(request: NextRequest) {
  const requestId = `paypal-check-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const logger = createPaymentLogger("paypal-check", requestId)
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
        // Try to find by searching in payment_details
        logger.debug("Transaction not found by plan_id, searching in payment_details", { orderId })

        const { data: transactions, error: searchError } = await supabase
          .from("premium_transactions")
          .select("*")
          .eq("payment_gateway", "paypal")

        if (searchError) {
          logger.error("Error searching transactions", searchError)
          return NextResponse.json({ success: false, error: "Error searching transactions" }, { status: 500 })
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

          // Log the webhook for future reference even if we can't find the transaction
          await supabase.from("payment_notification_logs").insert({
            request_id: requestId,
            gateway: "paypal",
            raw_payload: { orderId, action: "check-status" },
            status: "unmatched",
            order_id: orderId,
            event_type: "status-check",
            error: "Transaction not found",
          })

          return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
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

    // Log transaction details for debugging
    logger.debug("Transaction details", {
      id: transaction.id,
      status: transaction.status,
      gateway_reference: transaction.gateway_reference,
      payment_details: transaction.payment_details,
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

    // PERBAIKAN: Jika masih tidak ada PayPal order ID, coba cari di database lagi
    if (!paypalOrderId) {
      logger.warn("No PayPal order ID found in transaction, searching recent transactions", {
        transactionId: transaction.id,
      })

      // Cari transaksi terbaru dengan user_id yang sama
      const { data: recentTransactions } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("user_id", transaction.user_id)
        .eq("payment_gateway", "paypal")
        .order("created_at", { ascending: false })
        .limit(5)

      if (recentTransactions && recentTransactions.length > 0) {
        // Cari transaksi dengan gateway_reference
        const transactionWithReference = recentTransactions.find((tx) => tx.gateway_reference)

        if (transactionWithReference) {
          paypalOrderId = transactionWithReference.gateway_reference
          logger.info("Found PayPal order ID from recent transaction", {
            paypalOrderId,
            transactionId: transactionWithReference.id,
          })

          // Update current transaction with the found gateway_reference
          await supabase
            .from("premium_transactions")
            .update({
              gateway_reference: paypalOrderId,
              payment_details: {
                ...transaction.payment_details,
                gateway_reference: paypalOrderId,
                recovered: true,
                recovered_at: new Date().toISOString(),
              },
            })
            .eq("id", transaction.id)

          logger.info("Updated transaction with recovered PayPal order ID", {
            transactionId: transaction.id,
            paypalOrderId,
          })
        }
      }
    }

    // Log aktivitas ke payment_notification_logs
    await supabase.from("payment_notification_logs").insert({
      request_id: requestId,
      gateway: "paypal",
      raw_payload: {
        action: "check-status",
        orderId: orderId,
        paypalOrderId: paypalOrderId || null,
        transactionId: transaction.id,
      },
      status: transaction.status,
      transaction_id: transaction.id,
      order_id: orderId,
      event_type: "status-check",
    })

    // If still no PayPal order ID, we need to handle this case
    if (!paypalOrderId) {
      logger.warn("No PayPal order ID found in any transaction", {
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

    // Get PayPal gateway
    const paypalGateway = await getPaymentGateway("paypal")

    // Check order status
    const result = await paypalGateway.checkOrderStatus(paypalOrderId)

    if (!result.success) {
      logger.error("Failed to check PayPal order status", null, {
        error: result.error,
        paypalOrderId,
      })

      // Update log entry with error
      await supabase
        .from("payment_notification_logs")
        .update({
          status: "error",
          error: result.error,
        })
        .eq("request_id", requestId)

      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    logger.info("PayPal order status", {
      paypalOrderId,
      status: result.status,
      details: result.details?.status,
    })

    // Map PayPal status to our status
    let newStatus = transaction.status
    let isPremium = false

    if (result.status === "COMPLETED" || result.status === "APPROVED") {
      newStatus = "success"
      isPremium = true
    } else if (result.status === "VOIDED" || result.status === "CANCELLED") {
      newStatus = "failed"
    }

    // Update log entry with PayPal status
    await supabase
      .from("payment_notification_logs")
      .update({
        status: newStatus,
        parsed_payload: result.details,
      })
      .eq("request_id", requestId)

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
            paypalStatus: result.status,
            paypalOrderId: paypalOrderId,
            details: result.details,
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
            paypalStatus: result.status,
            paypalOrderId: paypalOrderId,
            details: result.details,
            checked_at: new Date().toISOString(),
          },
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.warn("Failed to update payment details", updateError)
      }
    }

    // Return current status
    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        status: newStatus,
        paypalStatus: result.status,
        paypalOrderId: paypalOrderId,
      },
      isPremium,
    })
  } catch (error: any) {
    logger.error("Error checking PayPal status:", error)

    // Try to log the error
    try {
      const supabase = createClient()
      await supabase.from("payment_notification_logs").insert({
        request_id: requestId,
        gateway: "paypal",
        raw_payload: { error: error.message },
        status: "error",
        event_type: "status-check-error",
        error: error.message,
      })
    } catch (logError) {
      logger.error("Failed to log error", logError)
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
