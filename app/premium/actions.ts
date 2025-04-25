"use server"

import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { generateOrderId } from "@/lib/payment/types"

export async function createTransaction(gatewayName = "duitku") {
  try {
    // Verifikasi user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Ambil data user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, email, is_premium")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: "User not found" }
    }

    // Cek apakah user sudah premium
    if (userData.is_premium) {
      return { success: false, error: "User already premium" }
    }

    // Ambil konfigurasi harga premium
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

    // Generate order ID
    const orderId = generateOrderId(user.id)

    // Buat transaksi di database
    const { error: transactionError } = await supabase.from("premium_transactions").insert({
      user_id: user.id,
      plan_id: orderId,
      amount: premiumPrice,
      status: "pending",
      payment_gateway: gatewayName,
    })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return { success: false, error: "Failed to create transaction" }
    }

    // Dapatkan gateway pembayaran
    const gateway = await getPaymentGateway(gatewayName)

    // Siapkan URL callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    // Buat transaksi di gateway pembayaran
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
      // Hapus transaksi dari database karena gagal
      await supabase.from("premium_transactions").delete().eq("plan_id", orderId)

      return {
        success: false,
        error: result.error || "Failed to create payment transaction",
      }
    }

    // Update transaksi dengan referensi dari gateway
    if (result.gatewayReference) {
      await supabase
        .from("premium_transactions")
        .update({
          gateway_reference: result.gatewayReference,
        })
        .eq("plan_id", orderId)
    }

    return {
      success: true,
      redirectUrl: result.redirectUrl,
      token: result.token,
      orderId: orderId,
    }
  } catch (error: any) {
    console.error("Error in create transaction:", error)
    return {
      success: false,
      error: error.message || "Internal server error",
    }
  }
}
