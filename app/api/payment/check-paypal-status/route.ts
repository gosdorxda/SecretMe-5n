import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { createPaymentLogger } from "@/lib/payment/payment-logger"

export async function GET(request: NextRequest) {
  const logger = createPaymentLogger("paypal-check")
  logger.info("Checking PayPal payment status")

  try {
    // Get order ID from query params
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    if (!orderId) {
      logger.error("Missing order_id parameter")
      return NextResponse.json({ error: "Missing order_id parameter" }, { status: 400 })
    }

    logger.info("Checking PayPal order status", { orderId })

    // Find transaction in database
    const supabase = createClient()
    const { data: transaction, error } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("plan_id", orderId)
      .single()

    if (error) {
      logger.error("Transaction not found", error, { orderId })
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Get PayPal gateway
    const paypalGateway = await getPaymentGateway("paypal")

    // Get PayPal order ID from transaction
    // First check gateway_reference, then payment_details
    const paypalOrderId =
      transaction.gateway_reference || (transaction.payment_details && transaction.payment_details.id)

    if (!paypalOrderId) {
      logger.error("PayPal order ID not found in transaction", null, {
        transactionId: transaction.id,
        orderId,
      })
      return NextResponse.json(
        {
          error: "PayPal order ID not found in transaction",
          transaction: {
            id: transaction.id,
            status: transaction.status,
            gateway: transaction.payment_gateway,
          },
        },
        { status: 400 },
      )
    }

    // Check status with PayPal
    const result = await paypalGateway.checkOrderStatus(paypalOrderId)

    if (!result.success) {
      logger.error("Failed to check PayPal order status", null, {
        error: result.error,
        paypalOrderId,
      })
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    logger.info("PayPal order status retrieved", {
      paypalOrderId,
      status: result.status,
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
          payment_details: {
            ...transaction.payment_details,
            paypalStatus: result.status,
            details: result.details,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction", updateError)
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
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
          return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
        }

        logger.info("User is now premium", { userId: transaction.user_id })
      }
    } else {
      logger.info("Transaction status unchanged", {
        transactionId: transaction.id,
        status: transaction.status,
      })
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
    logger.error("Error checking PayPal status", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
