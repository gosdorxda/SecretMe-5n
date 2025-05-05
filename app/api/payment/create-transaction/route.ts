import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { generateOrderId } from "@/lib/payment/types"
import { createPaymentLogger } from "@/lib/payment/payment-logger"

export async function POST(request: NextRequest) {
  const requestId = `payment-create-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const logger = createPaymentLogger("transaction")
  logger.info("Starting transaction creation")

  try {
    // Verifikasi user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error("Unauthorized user")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Ambil data dari request
    const body = await request.json()
    const gatewayName = body.gatewayName || process.env.ACTIVE_PAYMENT_GATEWAY || "duitku"
    const paymentMethod = body.paymentMethod

    logger.info(`Request data: gatewayName=${gatewayName}, paymentMethod=${paymentMethod || "default"}`)

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, email, is_premium")
      .eq("id", user.id)
      .single()

    if (userError) {
      logger.error(`User data error: ${userError.message}`)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (userData.is_premium) {
      logger.info("User is already premium")
      return NextResponse.json({ success: false, error: "User is already premium" }, { status: 400 })
    }

    // Get premium price from site_config or env
    // Ambil dari database jika ada
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    // Gunakan harga dari database jika ada, jika tidak gunakan dari env
    const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

    logger.info(`Premium price: ${premiumPrice}`)

    // Generate order ID
    const orderId = generateOrderId(user.id)
    logger.info(`Generated order ID: ${orderId}`)

    // Create transaction record
    const { error: transactionError } = await supabase.from("premium_transactions").insert({
      user_id: user.id,
      plan_id: orderId,
      amount: premiumPrice,
      status: "pending",
      payment_gateway: gatewayName,
      payment_method: paymentMethod,
    })

    if (transactionError) {
      logger.error(`Transaction record error: ${transactionError.message}`)
      return NextResponse.json({ success: false, error: "Failed to create transaction record" }, { status: 500 })
    }

    logger.info(`Transaction record created for order: ${orderId}`)

    // Get payment gateway
    const gateway = await getPaymentGateway(gatewayName)
    logger.info(`Using payment gateway: ${gatewayName}`)

    // Prepare callback URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    // Create transaction in payment gateway
    const result = await gateway.createTransaction({
      userId: user.id,
      userEmail: userData.email || user.email || "",
      userName: userData.name || "User",
      amount: premiumPrice,
      orderId: orderId,
      description: "SecretMe Premium Lifetime",
      successRedirectUrl: `${appUrl}/dashboard?status=success&order_id=${orderId}`,
      failureRedirectUrl: `${appUrl}/premium?status=failed&order_id=${orderId}`,
      pendingRedirectUrl: `${appUrl}/dashboard?status=pending&order_id=${orderId}`,
      notificationUrl: `${appUrl}/api/payment/notification`,
      paymentMethod: paymentMethod,
    })

    if (!result.success) {
      logger.error(`Gateway error: ${result.error}`)

      // Delete transaction from database because it failed
      await supabase.from("premium_transactions").delete().eq("plan_id", orderId)

      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    logger.info(`Gateway transaction created: ${result.gatewayReference || result.token}`)

    // Update transaction with gateway reference
    if (result.gatewayReference || result.token) {
      await supabase
        .from("premium_transactions")
        .update({
          payment_details: {
            gateway_reference: result.gatewayReference,
            redirect_url: result.redirectUrl,
            token: result.token,
          },
        })
        .eq("plan_id", orderId)
    }

    logger.info(`Transaction updated with gateway reference`)

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      orderId: orderId,
      token: result.token,
    })
  } catch (error: any) {
    logger.error(`Unexpected error: ${error.message}`)
    console.error(`[${requestId}] Error stack:`, error.stack || "No stack trace available")
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create transaction" },
      { status: 500 },
    )
  }
}
