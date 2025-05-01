"use server"

import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { generateOrderId } from "@/lib/payment/types"
import { revalidatePath } from "next/cache"

// Perbarui fungsi createTransaction untuk menerima parameter gateway
export async function createTransaction(paymentMethod: string, gatewayName = "duitku") {
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

    // Kirim request ke API dengan gatewayName
    const response = await fetch("/api/payment/create-transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethod,
        gatewayName, // Tambahkan gatewayName ke body request
      }),
    })

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: "Anda harus login terlebih dahulu" }
    }

    // Get user data
    const { data: userData } = await supabase
      .from("users")
      .select("name, email, is_premium")
      .eq("id", session.user.id)
      .single()

    if (!userData) {
      return { success: false, error: "Data pengguna tidak ditemukan" }
    }

    if (userData.is_premium) {
      return { success: false, error: "Anda sudah menjadi pengguna premium" }
    }

    // Get premium price from config or env
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

    // Generate order ID
    const orderId = generateOrderId(session.user.id)

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("premium_transactions")
      .insert({
        user_id: session.user.id,
        plan_id: orderId,
        amount: premiumPrice,
        status: "pending",
        payment_gateway: "duitku",
        payment_method: paymentMethod, // Simpan metode pembayaran yang dipilih
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      return { success: false, error: "Gagal membuat catatan transaksi" }
    }

    // Get payment gateway
    const gateway = await getPaymentGateway("duitku")

    // Create transaction in payment gateway
    const result = await gateway.createTransaction({
      userId: session.user.id,
      userEmail: userData.email || session.user.email || "",
      userName: userData.name || "User",
      amount: premiumPrice,
      orderId: orderId,
      description: "SecretMe Premium Lifetime",
      successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/premium?status=success&order_id=${orderId}`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/premium?status=failed&order_id=${orderId}`,
      pendingRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/premium?status=pending&order_id=${orderId}`,
      notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/notification`,
      paymentMethod: paymentMethod, // Teruskan metode pembayaran ke gateway
    })

    if (!result.success) {
      // Update transaction status to failed
      await supabase
        .from("premium_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          payment_details: { error: result.error },
        })
        .eq("id", transaction.id)

      return { success: false, error: result.error || "Gagal membuat transaksi" }
    }

    // Update transaction with gateway reference
    await supabase
      .from("premium_transactions")
      .update({
        payment_details: {
          gateway_reference: result.gatewayReference,
          redirect_url: result.redirectUrl,
        },
      })
      .eq("id", transaction.id)

    return {
      success: true,
      redirectUrl: result.redirectUrl,
      orderId: orderId,
      token: result.token,
    }
  } catch (error: any) {
    console.error("Error creating transaction:", error)
    return { success: false, error: error.message || "Failed to create transaction" }
  }
}

// Fungsi untuk mendapatkan transaksi terbaru
export async function getLatestTransaction() {
  try {
    // Verifikasi user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized", isPremium: false, hasTransaction: false }
    }

    // Periksa apakah user sudah premium
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_premium")
      .eq("id", user.id)
      .single()

    if (userError) {
      return { success: false, error: "User not found", isPremium: false, hasTransaction: false }
    }

    if (userData.is_premium) {
      return { success: true, isPremium: true, hasTransaction: false }
    }

    // Dapatkan transaksi terbaru
    const { data: transactionData, error: transactionError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (transactionError) {
      return { success: true, isPremium: false, hasTransaction: false }
    }

    // Format transaksi untuk client
    const transaction = {
      id: transactionData.id,
      orderId: transactionData.plan_id,
      status: transactionData.status,
      amount: transactionData.amount,
      paymentMethod: transactionData.payment_method || "",
      createdAt: transactionData.created_at,
      updatedAt: transactionData.updated_at,
      gateway: transactionData.payment_gateway,
    }

    return { success: true, isPremium: false, hasTransaction: true, transaction }
  } catch (error: any) {
    console.error("Error in get latest transaction:", error)
    return { success: false, error: error.message || "Internal server error", isPremium: false, hasTransaction: false }
  }
}

// Fungsi untuk mendapatkan riwayat transaksi
export async function getTransactionHistory() {
  try {
    // Verifikasi user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "Unauthorized", transactions: [] }
    }

    // Dapatkan transaksi
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (transactionsError) {
      return { success: false, error: "Failed to get transactions", transactions: [] }
    }

    // Format transaksi untuk client
    const transactions = transactionsData.map((tx) => ({
      id: tx.id,
      orderId: tx.plan_id,
      status: tx.status,
      amount: tx.amount,
      paymentMethod: tx.payment_method || "",
      createdAt: tx.created_at,
      updatedAt: tx.updated_at,
      gateway: tx.payment_gateway,
    }))

    return { success: true, transactions }
  } catch (error: any) {
    console.error("Error in get transaction history:", error)
    return { success: false, error: error.message || "Internal server error", transactions: [] }
  }
}

// Fungsi untuk membatalkan transaksi
export async function cancelTransaction(transactionId: string) {
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

    // Dapatkan transaksi
    const { data: transactionData, error: transactionError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", user.id)
      .single()

    if (transactionError) {
      return { success: false, error: "Transaction not found" }
    }

    // Periksa apakah transaksi bisa dibatalkan
    if (transactionData.status !== "pending") {
      return { success: false, error: "Only pending transactions can be cancelled" }
    }

    // Update status transaksi
    const { error: updateError } = await supabase
      .from("premium_transactions")
      .update({ status: "cancelled" })
      .eq("id", transactionId)

    if (updateError) {
      return { success: false, error: "Failed to cancel transaction" }
    }

    // Revalidasi path
    revalidatePath("/premium")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error in cancel transaction:", error)
    return { success: false, error: error.message || "Internal server error" }
  }
}
