"use server"

import { createClient } from "@/lib/supabase/server"
import { generateOrderId } from "@/lib/payment/types"

// Fungsi untuk membuat transaksi pengujian
export async function createTestTransaction(amount: number) {
  try {
    const supabase = createClient()

    // Verifikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Periksa apakah user adalah admin
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Generate order ID
    const orderId = generateOrderId(user.id)

    // Buat transaksi di database
    const { data: transaction, error: transactionError } = await supabase
      .from("premium_transactions")
      .insert({
        user_id: user.id,
        plan_id: orderId,
        amount: amount,
        status: "pending",
        payment_gateway: "duitku",
        payment_method: "test",
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error creating test transaction:", transactionError)
      return { success: false, error: "Failed to create test transaction" }
    }

    return { success: true, transaction }
  } catch (error: any) {
    console.error("Error in create test transaction:", error)
    return {
      success: false,
      error: error.message || "Internal server error",
    }
  }
}

// Fungsi untuk mensimulasikan notifikasi pembayaran
export async function simulatePaymentNotification(params: {
  merchantOrderId: string
  resultCode: string
  amount: string
  paymentCode: string
}) {
  try {
    const supabase = createClient()

    // Verifikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Periksa apakah user adalah admin
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Buat payload notifikasi
    const notificationPayload = {
      merchantCode: process.env.DUITKU_MERCHANT_CODE || "DS22804",
      amount: params.amount,
      merchantOrderId: params.merchantOrderId,
      productDetail: "SecretMe Premium Lifetime",
      additionalParam: "",
      resultCode: params.resultCode,
      paymentCode: params.paymentCode,
      reference: `DS22804${Date.now().toString().substring(7)}`,
      signature: "simulatedsignature",
    }

    // Kirim notifikasi ke endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const response = await fetch(`${appUrl}/api/payment/notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(notificationPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Failed to send notification: ${errorText}` }
    }

    const result = await response.json()
    return { success: true, message: "Notification sent successfully", result }
  } catch (error: any) {
    console.error("Error in simulate payment notification:", error)
    return {
      success: false,
      error: error.message || "Internal server error",
    }
  }
}

// Fungsi untuk memeriksa status transaksi
export async function checkTransactionStatus(orderId: string) {
  try {
    const supabase = createClient()

    // Verifikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Periksa apakah user adalah admin
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Ambil data transaksi dari database
    const { data: transaction, error: transactionError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("plan_id", orderId)
      .single()

    if (transactionError) {
      console.error("Error checking transaction status:", transactionError)
      return { success: false, error: "Failed to check transaction status" }
    }

    return { success: true, transaction }
  } catch (error: any) {
    console.error("Error in check transaction status:", error)
    return {
      success: false,
      error: error.message || "Internal server error",
    }
  }
}
