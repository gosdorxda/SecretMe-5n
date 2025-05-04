import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { PayPalGateway } from "@/lib/payment/paypal-gateway"

export async function GET(request: NextRequest) {
  try {
    // Get orderId from query params
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
    }

    // Get user session
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Initialize PayPal gateway
    const paypalGateway = new PayPalGateway()

    // Check order status
    const orderStatus = await paypalGateway.checkOrderStatus(orderId)

    if (!orderStatus.success) {
      return NextResponse.json(
        {
          success: false,
          error: orderStatus.error || "Failed to check PayPal order status",
        },
        { status: 400 },
      )
    }

    // If payment is completed, update transaction status and user premium status
    if (orderStatus.status === "COMPLETED") {
      // Get transaction from database
      const { data: transaction, error: transactionError } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("plan_id", orderId)
        .single()

      if (transactionError) {
        console.error("Error fetching transaction:", transactionError)
        return NextResponse.json({
          success: true,
          status: orderStatus.status,
          message: "Payment completed but failed to update transaction status",
        })
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "success",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) {
        console.error("Error updating transaction:", updateError)
        return NextResponse.json({
          success: true,
          status: orderStatus.status,
          message: "Payment completed but failed to update transaction status",
        })
      }

      // Update user premium status
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (userUpdateError) {
        console.error("Error updating user premium status:", userUpdateError)
        return NextResponse.json({
          success: true,
          status: orderStatus.status,
          message: "Payment completed but failed to update user premium status",
        })
      }

      return NextResponse.json({
        success: true,
        status: orderStatus.status,
        message: "Payment completed and user upgraded to premium",
      })
    }

    // Return order status
    return NextResponse.json({
      success: true,
      status: orderStatus.status,
      details: orderStatus.details,
    })
  } catch (error) {
    console.error("Error checking PayPal status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
