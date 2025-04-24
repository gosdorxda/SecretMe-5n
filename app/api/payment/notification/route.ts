import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMidtransCoreApiUrl, getMidtransAuthHeader } from "@/lib/midtrans"

export async function POST(request: NextRequest) {
  try {
    // Parse notification data
    const notificationData = await request.json()
    console.log("Received Midtrans notification:", JSON.stringify(notificationData))

    // Extract important data
    const orderId = notificationData.order_id
    const transactionStatus = notificationData.transaction_status
    const fraudStatus = notificationData.fraud_status
    const paymentType = notificationData.payment_type
    const grossAmount = notificationData.gross_amount

    // Skip processing for test notifications
    if (orderId.includes("payment_notif_test")) {
      console.log("Skipping test notification:", orderId)
      return NextResponse.json({ success: true, message: "Test notification received" })
    }

    // Verify transaction with Midtrans
    try {
      const statusUrl = `${getMidtransCoreApiUrl()}/v2/${orderId}/status`
      const response = await fetch(statusUrl, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: getMidtransAuthHeader(),
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to verify transaction with Midtrans: ${errorText}`)
        return NextResponse.json({ error: "Failed to verify transaction with Midtrans" }, { status: 500 })
      }

      const transactionData = await response.json()
      console.log("Transaction verified with Midtrans:", JSON.stringify(transactionData))
    } catch (error) {
      console.error("Error verifying transaction with Midtrans:", error)
      // Continue processing even if verification fails
    }

    // Find transaction in database
    const supabase = createClient()
    const { data: transaction, error: findError } = await supabase
      .from("premium_transactions")
      .select("id, user_id, status")
      .eq("plan_id", orderId)
      .single()

    if (findError) {
      console.error(`Transaction not found for order_id ${orderId}:`, findError)
      return NextResponse.json({ error: "Transaction not found", order_id: orderId }, { status: 404 })
    }

    // Determine new status
    let newStatus = transaction.status
    let isPremium = false

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "accept" || fraudStatus === undefined) {
        newStatus = "success"
        isPremium = true
      }
    } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
      newStatus = "failed"
    } else if (transactionStatus === "pending") {
      newStatus = "pending"
    }

    // Update transaction in database
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
      console.error("Failed to update transaction:", updateError)
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
    }

    // Update user premium status if payment is successful
    if (isPremium) {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: null, // Lifetime premium
        })
        .eq("id", transaction.user_id)

      if (userUpdateError) {
        console.error("Failed to update user premium status:", userUpdateError)
        return NextResponse.json({ error: "Failed to update user premium status" }, { status: 500 })
      }

      console.log(`User ${transaction.user_id} is now premium!`)
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${orderId} updated to ${newStatus}`,
    })
  } catch (error) {
    console.error("Error processing Midtrans notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
