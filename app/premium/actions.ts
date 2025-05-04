"use server"

import { createClient, getVerifiedUser } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"

// Fungsi helper untuk mendapatkan pengaturan premium dari database
async function getPremiumSettings() {
  const supabase = createClient()

  // Default values from env
  let premiumPrice = Number.parseInt(process.env.PREMIUM_PRICE || "49000")
  let activeGateway = process.env.ACTIVE_PAYMENT_GATEWAY || "duitku"

  // Try to get from database
  const { data: configData } = await supabase
    .from("site_config")
    .select("config")
    .eq("type", "premium_settings")
    .single()

  if (configData?.config) {
    // Use price from database if available
    if (configData.config.price) {
      premiumPrice = Number.parseInt(configData.config.price.toString())
    }

    // Use active gateway from database if available
    if (configData.config.activeGateway) {
      activeGateway = configData.config.activeGateway
    }
  }

  return { premiumPrice, activeGateway }
}

// Perbarui fungsi createTransaction untuk menerima parameter gateway
export async function createTransaction(paymentMethod = "QR", gatewayName = "duitku", phoneNumber?: string) {
  try {
    // Dapatkan user terverifikasi
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return {
        success: false,
        error: "Data pengguna tidak ditemukan. Silakan login kembali.",
      }
    }

    // Ambil data user dari database
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (userError || !userData) {
      return {
        success: false,
        error: "Data pengguna tidak ditemukan di database.",
      }
    }

    // Cek apakah user sudah premium
    if (userData.is_premium) {
      return {
        success: false,
        error: "Anda sudah memiliki akun premium.",
      }
    }

    // Ambil harga premium dari environment variable
    const premiumPrice = Number.parseInt(process.env.PREMIUM_PRICE || "99000", 10)

    // Buat ID transaksi unik
    const orderId = `PM-${nanoid(10)}`

    // Buat URL redirect setelah pembayaran
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://secretme.site"
    const successRedirectUrl = `${baseUrl}/dashboard` // Pastikan redirect ke dashboard
    const failureRedirectUrl = `${baseUrl}/premium?status=failed&order_id=${orderId}`
    const notificationUrl = `${baseUrl}/api/payment/notification`

    // Dapatkan gateway pembayaran yang sesuai
    const gateway = await getPaymentGateway(gatewayName, phoneNumber)

    // Buat transaksi di gateway pembayaran
    const result = await gateway.createTransaction({
      userId: user.id,
      userEmail: user.email || "",
      userName: userData.name || userData.username || "User",
      userPhone: phoneNumber || userData.phone_number || "",
      amount: premiumPrice,
      orderId: orderId,
      description: "SecretMe Premium Lifetime",
      successRedirectUrl,
      failureRedirectUrl,
      notificationUrl,
      paymentMethod,
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Gagal membuat transaksi.",
      }
    }

    // Simpan transaksi ke database
    const { error: insertError } = await supabase.from("premium_transactions").insert({
      user_id: user.id,
      plan_id: orderId,
      amount: premiumPrice,
      status: "pending",
      payment_method: paymentMethod,
      payment_gateway: gatewayName,
      payment_details: {
        gateway_reference: result.gatewayReference,
        redirect_url: result.redirectUrl,
      },
    })

    if (insertError) {
      console.error("Error inserting transaction:", insertError)
      return {
        success: false,
        error: "Gagal menyimpan transaksi ke database.",
      }
    }

    // Kembalikan hasil
    return {
      success: true,
      redirectUrl: result.redirectUrl,
      orderId: orderId,
    }
  } catch (error: any) {
    console.error("Error creating transaction:", error)
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat membuat transaksi.",
    }
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
    // Buat logger untuk tracking
    const requestId = `cancel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    console.log(`[${requestId}] 🔄 Cancelling transaction ${transactionId}`)

    // Verifikasi user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log(`[${requestId}] ❌ Unauthorized user`)
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
      console.log(`[${requestId}] ❌ Transaction not found: ${transactionError.message}`)
      return { success: false, error: "Transaction not found" }
    }

    // Periksa apakah transaksi bisa dibatalkan
    if (transactionData.status !== "pending") {
      console.log(`[${requestId}] ❌ Transaction cannot be cancelled: status is ${transactionData.status}`)
      return { success: false, error: "Only pending transactions can be cancelled" }
    }

    console.log(
      `[${requestId}] 📋 Transaction details: gateway=${transactionData.payment_gateway}, plan_id=${transactionData.plan_id}`,
    )

    // Coba batalkan transaksi di gateway pembayaran
    const gatewayName = transactionData.payment_gateway || "duitku"
    console.log(`[${requestId}] 🔍 Detected payment gateway: ${gatewayName}`)

    // Periksa apakah ada referensi gateway
    const gatewayReference = transactionData.payment_details?.gateway_reference

    // Untuk TriPay, kita tidak memanggil API cancel dan membiarkan transaksi expired dengan sendirinya
    if (gatewayName !== "tripay" && gatewayReference) {
      try {
        console.log(`[${requestId}] 🔄 Attempting to cancel transaction in ${gatewayName}: ${gatewayReference}`)

        // Dapatkan gateway
        const gateway = await getPaymentGateway(gatewayName)

        // Periksa apakah gateway mendukung pembatalan
        if (typeof gateway.cancelTransaction === "function") {
          // Batalkan transaksi di gateway
          const cancelResult = await gateway.cancelTransaction(gatewayReference)

          if (!cancelResult.success) {
            console.error(
              `[${requestId}] ⚠️ Warning: Failed to cancel transaction in ${gatewayName}: ${cancelResult.error}`,
            )
            // Lanjutkan proses meskipun gagal di gateway, karena kita masih ingin mengubah status di database lokal
          } else {
            console.log(
              `[${requestId}] ✅ Successfully cancelled transaction in ${gatewayName}: ${cancelResult.message}`,
            )
          }
        } else {
          console.log(`[${requestId}] ℹ️ Gateway ${gatewayName} does not support cancellation API`)
        }
      } catch (error: any) {
        console.error(`[${requestId}] ⚠️ Error cancelling transaction in ${gatewayName}:`, error)
        // Lanjutkan proses meskipun gagal di gateway
      }
    } else if (gatewayName === "tripay") {
      console.log(`[${requestId}] ℹ️ Skipping TriPay API cancel call, letting transaction expire naturally`)
    } else {
      console.log(`[${requestId}] ℹ️ No gateway reference found, skipping gateway cancellation`)
    }

    // Update status transaksi di database lokal
    console.log(`[${requestId}] 📝 Updating transaction status to cancelled in database`)
    const { error: updateError } = await supabase
      .from("premium_transactions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
        payment_details: {
          ...transactionData.payment_details,
          cancelled_at: new Date().toISOString(),
          cancelled_by: "user",
        },
      })
      .eq("id", transactionId)

    if (updateError) {
      console.error(`[${requestId}] ❌ Failed to update transaction status:`, updateError)
      return { success: false, error: "Failed to cancel transaction" }
    }

    console.log(`[${requestId}] ✅ Transaction successfully cancelled`)

    // Revalidasi path
    revalidatePath("/premium")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error: any) {
    console.error("Error in cancel transaction:", error)
    return { success: false, error: error.message || "Internal server error" }
  }
}
