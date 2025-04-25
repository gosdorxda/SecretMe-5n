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

    // Parse notification data
    const notificationData = await request.json()
    console.log(`[${requestId}] 📦 Payload:`, JSON.stringify(notificationData))

    // Determine which gateway to use based on the notification data
    // This could be determined by headers, payload structure, or a query parameter
    const gatewayName = "duitku" // Default to Duitku

    // Get the appropriate payment gateway
    const gateway = await getPaymentGateway(gatewayName)

    // Process the notification with the gateway
    const result = await gateway.handleNotification(notificationData)

    // Extract important data
    const orderId = result.orderId
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
      .select("id, user_id, status")
      .eq("plan_id", orderId)
      .single()

    if (findError) {
      console.error(`[${requestId}] ❌ Transaction not found for order_id ${orderId}:`, findError)
      return NextResponse.json({ error: "Transaction not found", order_id: orderId }, { status: 404 })
    }

    console.log(
      `[${requestId}] ✅ Found transaction in database: ID=${transaction.id}, UserID=${transaction.user_id}, CurrentStatus=${transaction.status}`,
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

    console.log(`[${requestId}] ✅ Notification processing completed successfully`)
    return NextResponse.json({
      success: true,
      message: `Transaction ${orderId} updated to ${newStatus}`,
      requestId: requestId,
    })
  } catch (error) {
    console.error(`[${requestId}] 💥 Unhandled error processing payment notification:`, error)
    return NextResponse.json({ error: "Internal server error", requestId: requestId }, { status: 500 })
  }
}
