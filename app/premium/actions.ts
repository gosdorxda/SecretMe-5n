"use server"

import { createClient } from "@/lib/supabase/server"
import { generateOrderId, getMidtransSnapApiUrl, MIDTRANS_CONFIG, getMidtransAuthHeader } from "@/lib/midtrans"

export async function createTransaction() {
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

    // Generate order ID
    const orderId = generateOrderId(user.id)

    // Buat transaksi di database
    const { error: transactionError } = await supabase.from("premium_transactions").insert({
      user_id: user.id,
      plan_id: orderId,
      amount: MIDTRANS_CONFIG.premiumPrice,
      status: "pending",
    })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return { success: false, error: "Failed to create transaction" }
    }

    // Buat transaksi di Midtrans menggunakan Snap API
    const snapApiUrl = getMidtransSnapApiUrl()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: MIDTRANS_CONFIG.premiumPrice,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: userData.name || "User",
        email: userData.email,
      },
      item_details: [
        {
          id: "premium-lifetime",
          price: MIDTRANS_CONFIG.premiumPrice,
          quantity: 1,
          name: "SecretMe Premium Lifetime",
        },
      ],
      callbacks: {
        finish: `${appUrl}/payment/status?order_id=${orderId}&status=success`,
        error: `${appUrl}/payment/status?order_id=${orderId}&status=failed`,
        pending: `${appUrl}/payment/status?order_id=${orderId}&status=pending`,
        notification: `${appUrl}/api/payment/notification`,
      },
    }

    // Dapatkan header auth yang benar
    const authHeader = getMidtransAuthHeader()

    const midtransResponse = await fetch(snapApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(transactionDetails),
    })

    if (!midtransResponse.ok) {
      const errorData = (await midtransResponse.json().catch(() => null)) || (await midtransResponse.text())
      console.error("Midtrans error:", errorData)

      // Hapus transaksi dari database karena gagal
      await supabase.from("premium_transactions").delete().eq("plan_id", orderId)

      return {
        success: false,
        error: "Failed to create Midtrans transaction",
      }
    }

    const midtransData = await midtransResponse.json()

    return {
      success: true,
      redirectUrl: midtransData.redirect_url,
      token: midtransData.token,
    }
  } catch (error: any) {
    console.error("Error in create transaction:", error)
    return {
      success: false,
      error: error.message || "Internal server error",
    }
  }
}
