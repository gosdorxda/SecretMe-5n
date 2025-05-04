import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { createPaymentLogger } from "@/lib/payment/payment-logger"

export async function GET(request: NextRequest) {
  const logger = createPaymentLogger("paypal-check")
  logger.info("Checking PayPal payment status")

  try {
    // Get orderId from query params
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      logger.error("Missing orderId parameter")
      return NextResponse.json({ success: false, error: "Missing orderId parameter" }, { status: 400 })
    }

    logger.info("Checking PayPal order status", { orderId })

    // Get PayPal gateway
    const paypalGateway = await getPaymentGateway("paypal")

    // Check order status
    const orderStatus = await paypalGateway.checkOrderStatus(orderId)

    if (!orderStatus.success) {
      logger.error("Failed to check PayPal order status", null, { error: orderStatus.error })
      return NextResponse.json({ success: false, error: orderStatus.error }, { status: 500 })
    }

    logger.info("PayPal order status retrieved", { orderId, status: orderStatus.status })

    // Find transaction in database
    const supabase = createClient()

    // First try to find by gateway_reference
    let { data: transaction, error: findError } = await supabase
      .from("premium_transactions")
      .select("id, user_id, status, payment_gateway")
      .eq("gateway_reference", orderId)
      .single()

    // If not found by gateway_reference, try by plan_id
    if (findError) {
      logger.debug("Transaction not found by gateway_reference, trying plan_id", { orderId })
      const { data: transactionByPlanId, error: findByPlanIdError } = await supabase
        .from("premium_transactions")
        .select("id, user_id, status, payment_gateway")
        .eq("plan_id", orderId)
        .single()

      if (findByPlanIdError) {
        logger.error("Transaction not found", findByPlanIdError, { orderId })
        return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
      }

      transaction = transactionByPlanId
    }

    logger.info("Found transaction in database", {
      transactionId: transaction.id,
      userId: transaction.user_id,
      currentStatus: transaction.status,
    })

    // If PayPal status is COMPLETED or APPROVED, update transaction status to success
    let newStatus = transaction.status
    let isPremium = false

    if (orderStatus.status === "COMPLETED" || orderStatus.status === "APPROVED") {
      newStatus = "success"
      isPremium = true
      logger.info("Payment successful", { newStatus: "success", isPremium: true })
    } else if (orderStatus.status === "VOIDED" || orderStatus.status === "CANCELLED") {
      newStatus = "failed"
      logger.info("Payment failed", { newStatus: "failed", isPremium: false })
    }

    // Only update if status has changed
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
          payment_method: "PayPal",
          payment_details: orderStatus.details,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        logger.error("Failed to update transaction", updateError, { transactionId: transaction.id })
        return NextResponse.json({ success: false, error: "Failed to update transaction" }, { status: 500 })
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
          return NextResponse.json({ success: false, error: "Failed to update user premium status" }, { status: 500 })
        }

        logger.info("User is now premium", { userId: transaction.user_id, isPremium: true })
      }
    } else {
      logger.info("Transaction status unchanged", { status: transaction.status })
    }

    return NextResponse.json({
      success: true,
      message: `Transaction status: ${newStatus}`,
      status: newStatus,
      paypalStatus: orderStatus.status,
      updated: newStatus !== transaction.status,
    })
  } catch (error: any) {
    logger.error("Error checking PayPal status", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error checking PayPal status: " + error.message,
      },
      { status: 500 },
    )
  }
}
