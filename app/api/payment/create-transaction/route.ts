import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { generateOrderId } from "@/lib/payment/types"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const gatewayName = body.gatewayName || "duitku"

    // Verify user - SECURITY FIX: Use getUser() instead of getSession()
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, email, is_premium")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if user is already premium
    if (userData.is_premium) {
      return NextResponse.json({ success: false, error: "User already premium" }, { status: 400 })
    }

    // Get premium price from config
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

    // Generate order ID
    const orderId = generateOrderId(user.id)

    // Create transaction in database
    const { error: transactionError } = await supabase.from("premium_transactions").insert({
      user_id: user.id,
      plan_id: orderId,
      amount: premiumPrice,
      status: "pending",
      payment_gateway: gatewayName,
    })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return NextResponse.json({ success: false, error: "Failed to create transaction" }, { status: 500 })
    }

    // Get payment gateway
    const gateway = await getPaymentGateway(gatewayName)

    // Prepare callback URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    // Ambil konfigurasi gateway dari database
    const { data: gatewayConfigData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "payment_gateway_config")
      .single()

    console.log("Gateway config from database:", gatewayConfigData?.config)

    // Jika ada konfigurasi di database, gunakan untuk override environment variables
    if (gatewayConfigData?.config?.gateways?.[gatewayName]) {
      const gatewayConfig = gatewayConfigData.config.gateways[gatewayName]

      // Set environment variables untuk digunakan oleh gateway
      if (gatewayName === "duitku") {
        if (gatewayConfig.merchantCode) {
          process.env.DUITKU_MERCHANT_CODE = gatewayConfig.merchantCode
        }
        if (gatewayConfig.apiKey) {
          process.env.DUITKU_API_KEY = gatewayConfig.apiKey
        }
      }

      console.log("Using gateway config from database for", gatewayName)
    }

    // Log the Duitku merchant code and API key being used
    console.log("Duitku Merchant Code:", process.env.DUITKU_MERCHANT_CODE)
    console.log("Duitku API Key:", process.env.DUITKU_API_KEY)

    // Create transaction in payment gateway
    const result = await gateway.createTransaction({
      userId: user.id,
      userEmail: userData.email,
      userName: userData.name || "User",
      amount: premiumPrice,
      orderId: orderId,
      description: "SecretMe Premium Lifetime",
      successRedirectUrl: `${appUrl}/dashboard?status=success&order_id=${orderId}`,
      failureRedirectUrl: `${appUrl}/premium?status=failed&order_id=${orderId}`,
      pendingRedirectUrl: `${appUrl}/dashboard?status=pending&order_id=${orderId}`,
      notificationUrl: `${appUrl}/api/payment/notification`,
    })

    if (!result.success) {
      // Delete transaction from database because it failed
      await supabase.from("premium_transactions").delete().eq("plan_id", orderId)

      return NextResponse.json(
        { success: false, error: result.error || "Failed to create payment transaction" },
        { status: 500 },
      )
    }

    // Update transaction with gateway reference - FIXED: Store in payment_details instead
    if (result.gatewayReference) {
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

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      token: result.token,
      orderId: orderId,
    })
  } catch (error: any) {
    console.error("Error in create transaction API:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
