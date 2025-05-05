import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { revalidatePath } from "next/cache"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Get supabase client
    const supabase = createClient()

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get transaction by order ID or gateway reference
    const { data: transaction, error: txError } = await supabase
      .from("premium_transactions")
      .select("*")
      .or(`plan_id.eq.${orderId},gateway_reference.eq.${orderId}`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (txError) {
      console.error("Error fetching transaction:", txError)
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
    }

    // Exit early if transaction is already successful
    if (transaction.status === "success") {
      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          orderId: transaction.plan_id,
          status: transaction.status,
        },
      })
    }

    // Get gateway reference from transaction
    let paypalOrderId = transaction.gateway_reference || orderId

    // If no gateway reference, try to get it from payment_details
    if (!paypalOrderId && transaction.payment_details) {
      const details =
        typeof transaction.payment_details === "string"
          ? JSON.parse(transaction.payment_details)
          : transaction.payment_details

      paypalOrderId = details?.gateway_reference || details?.token || orderId
    }

    // Get payment gateway
    const gateway = await getPaymentGateway("paypal")

    // Check order status in PayPal
    const statusResult = await gateway.checkOrderStatus(paypalOrderId)

    if (!statusResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: statusResult.error || "Failed to check PayPal status",
        },
        { status: 400 },
      )
    }

    console.log("PayPal status check result:", statusResult)

    // Handle different status from PayPal
    if (
      statusResult.status === "COMPLETED" ||
      statusResult.status === "APPROVED" ||
      statusResult.status === "CAPTURE"
    ) {
      // Update transaction status to success
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "success",
          updated_at: new Date().toISOString(),
          payment_details: {
            ...transaction.payment_details,
            paypal_status: statusResult.status,
            paypal_details: statusResult.details,
            completed_at: new Date().toISOString(),
          },
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("Error updating transaction:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update transaction" }, { status: 500 })
      }

      // Update user to premium
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
        })
        .eq("id", user.id)

      if (userUpdateError) {
        console.error("Error upgrading user to premium:", userUpdateError)
        return NextResponse.json({ success: false, error: "Failed to upgrade user to premium" }, { status: 500 })
      }

      // Log the successful payment
      await supabase.from("payment_notification_logs").insert({
        request_id: `paypal-verification-${Date.now()}`,
        gateway: "paypal",
        raw_payload: statusResult.details,
        status: "success",
        transaction_id: transaction.id,
        order_id: transaction.plan_id,
        event_type: "manual-verification",
      })

      // Revalidate pages
      revalidatePath("/premium")
      revalidatePath("/dashboard")

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          orderId: transaction.plan_id,
          status: "success",
        },
      })
    } else {
      // Update transaction with latest status but don't change the status code
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          payment_details: {
            ...transaction.payment_details,
            paypal_status: statusResult.status,
            paypal_details: statusResult.details,
            checked_at: new Date().toISOString(),
          },
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("Error updating transaction details:", updateError)
      }

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          orderId: transaction.plan_id,
          status: transaction.status,
          paypalStatus: statusResult.status,
        },
      })
    }
  } catch (error: any) {
    console.error("Error in check-paypal-status:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
