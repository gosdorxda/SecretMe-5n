import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMidtransCoreApiUrl, getMidtransAuthHeader } from "@/lib/midtrans"

export async function POST(request: NextRequest) {
  // Generate unique request ID for tracking this notification
  const requestId = `midtrans-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  console.log(`[${requestId}] 🔔 MIDTRANS NOTIFICATION RECEIVED`)

  try {
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log(`[${requestId}] 📋 Headers:`, JSON.stringify(headers))

    // Parse notification data
    const notificationData = await request.json()
    console.log(`[${requestId}] 📦 Payload:`, JSON.stringify(notificationData))

    // Extract important data
    const orderId = notificationData.order_id || "unknown"
    const transactionStatus = notificationData.transaction_status
    const fraudStatus = notificationData.fraud_status
    const paymentType = notificationData.payment_type
    const grossAmount = notificationData.gross_amount

    console.log(
      `[${requestId}] 🧾 Transaction details - OrderID: ${orderId}, Status: ${transactionStatus}, Payment: ${paymentType}, Amount: ${grossAmount}`,
    )

    // Skip processing for test notifications
    if (orderId.includes("payment_notif_test")) {
      console.log(`[${requestId}] ⚠️ Skipping test notification: ${orderId}`)
      return NextResponse.json({ success: true, message: "Test notification received" })
    }

    // Verify transaction with Midtrans
    try {
      const statusUrl = `${getMidtransCoreApiUrl()}/v2/${orderId}/status`
      console.log(`[${requestId}] 🔍 Verifying transaction with Midtrans - URL: ${statusUrl}`)

      const response = await fetch(statusUrl, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: getMidtransAuthHeader(),
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[${requestId}] ❌ Failed to verify transaction with Midtrans: ${response.status} - ${errorText}`)
        return NextResponse.json({ error: "Failed to verify transaction with Midtrans" }, { status: 500 })
      }

      const transactionData = await response.json()
      console.log(`[${requestId}] ✅ Transaction verified with Midtrans:`, JSON.stringify(transactionData))
    } catch (error) {
      console.error(`[${requestId}] ❌ Error verifying transaction with Midtrans:`, error)
      // Continue processing even if verification fails
    }

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

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "accept" || fraudStatus === undefined) {
        newStatus = "success"
        isPremium = true
        console.log(`[${requestId}] 🎉 Payment successful! Setting status to 'success'`)
      }
    } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
      newStatus = "failed"
      console.log(`[${requestId}] ❌ Payment failed or cancelled. Setting status to 'failed'`)
    } else if (transactionStatus === "pending") {
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
        payment_method: paymentType,
        payment_details: notificationData,
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
    console.error(`[${requestId}] 💥 Unhandled error processing Midtrans notification:`, error)
    return NextResponse.json({ error: "Internal server error", requestId: requestId }, { status: 500 })
  }
}
