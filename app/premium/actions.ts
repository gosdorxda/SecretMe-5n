"use server"

import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { generateOrderId } from "@/lib/payment/types"
import { revalidatePath } from "next/cache"

// Optimasi 1: Tambahkan caching untuk pengaturan premium
// Tambahkan variabel cache dan timestamp di luar fungsi
let premiumSettingsCache = null
let premiumSettingsCacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 menit

// Fungsi helper untuk mendapatkan pengaturan premium dari database
async function getPremiumSettings() {
  const supabase = createClient()

  // Gunakan cache jika masih valid
  const now = Date.now()
  if (premiumSettingsCache && now - premiumSettingsCacheTime < CACHE_TTL) {
    return premiumSettingsCache
  }

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

  // Simpan ke cache
  premiumSettingsCache = { premiumPrice, activeGateway }
  premiumSettingsCacheTime = now

  return { premiumPrice, activeGateway }
}

// Optimasi 2: Tambahkan caching untuk user data
const userDataCache = new Map()
const userDataCacheTime = new Map()
const USER_CACHE_TTL = 60 * 1000 // 1 menit

// Fungsi helper untuk mendapatkan data user dengan cache
async function getUserDataWithCache(supabase, userId) {
  const now = Date.now()
  if (userDataCache.has(userId) && now - userDataCacheTime.get(userId) < USER_CACHE_TTL) {
    return userDataCache.get(userId)
  }

  const { data, error } = await supabase.from("users").select("name, email, is_premium").eq("id", userId).single()

  if (error) {
    throw error
  }

  userDataCache.set(userId, data)
  userDataCacheTime.set(userId, now)
  return data
}

// Perbarui fungsi createTransaction untuk menerima parameter gateway
export async function createTransaction(paymentMethod: string, gatewayName: string | undefined) {
  try {
    const supabase = createClient()

    // Get premium settings (now cached)
    const { premiumPrice, activeGateway: defaultGateway } = await getPremiumSettings()

    // Use provided gateway or default
    const finalGatewayName = gatewayName || defaultGateway

    // Verifikasi user dengan getUser() - metode yang aman
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      return { success: false, error: "Unauthorized" }
    }

    const user = userData.user

    // Get user data from database (now cached)
    try {
      const userDbData = await getUserDataWithCache(supabase, user.id)

      if (userDbData.is_premium) {
        return { success: false, error: "Anda sudah menjadi pengguna premium" }
      }

      // Generate order ID
      const orderId = generateOrderId(user.id)

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from("premium_transactions")
        .insert({
          user_id: user.id,
          plan_id: orderId,
          amount: premiumPrice,
          status: "pending",
          payment_gateway: finalGatewayName,
          payment_method: paymentMethod,
        })
        .select()
        .single()

      if (transactionError) {
        console.error("Error creating transaction record:", transactionError)
        return { success: false, error: "Gagal membuat catatan transaksi" }
      }

      // Get payment gateway
      const gateway = await getPaymentGateway(finalGatewayName || defaultGateway)

      // Create transaction in payment gateway
      const result = await gateway.createTransaction({
        userId: user.id,
        userEmail: userDbData.email || user.email || "",
        userName: userDbData.name || "User",
        amount: premiumPrice,
        orderId: orderId,
        description: "SecretMe Premium Lifetime",
        successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/premium?status=success&order_id=${orderId}`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/premium?status=failed&order_id=${orderId}`,
        pendingRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/premium?status=pending&order_id=${orderId}`,
        notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/notification`,
        paymentMethod: paymentMethod,
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
    } catch (error) {
      console.error("Error getting user data:", error)
      return { success: false, error: "Gagal mendapatkan data pengguna" }
    }
  } catch (error: any) {
    console.error("Error creating transaction:", error)
    return { success: false, error: error.message || "Failed to create transaction" }
  }
}

// Optimasi 3: Tambahkan caching untuk transaksi terbaru
const latestTransactionCache = new Map()
const latestTransactionCacheTime = new Map()
const TRANSACTION_CACHE_TTL = 10 * 1000 // 10 detik

// Fungsi untuk mendapatkan transaksi terbaru
export async function getLatestTransaction() {
  try {
    // Verifikasi user
    const supabase = createClient()
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData.user) {
      return { success: false, error: "Unauthorized", isPremium: false, hasTransaction: false }
    }

    const user = userData.user
    const userId = user.id

    // Gunakan cache jika masih valid
    const now = Date.now()
    if (latestTransactionCache.has(userId) && now - latestTransactionCacheTime.get(userId) < TRANSACTION_CACHE_TTL) {
      return latestTransactionCache.get(userId)
    }

    // Periksa apakah user sudah premium
    try {
      const userDbData = await getUserDataWithCache(supabase, userId)

      if (userDbData.is_premium) {
        const result = { success: true, isPremium: true, hasTransaction: false }
        latestTransactionCache.set(userId, result)
        latestTransactionCacheTime.set(userId, now)
        return result
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
        const result = { success: true, isPremium: false, hasTransaction: false }
        latestTransactionCache.set(userId, result)
        latestTransactionCacheTime.set(userId, now)
        return result
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

      const result = { success: true, isPremium: false, hasTransaction: true, transaction }

      // Hanya cache jika status bukan pending (karena pending bisa berubah)
      if (transactionData.status !== "pending") {
        latestTransactionCache.set(userId, result)
        latestTransactionCacheTime.set(userId, now)
      }

      return result
    } catch (error) {
      console.error("Error getting user data:", error)
      return { success: false, error: "Gagal mendapatkan data pengguna", isPremium: false, hasTransaction: false }
    }
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
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData.user) {
      return { success: false, error: "Unauthorized", transactions: [] }
    }

    const user = userData.user

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
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData.user) {
      console.log(`[${requestId}] ❌ Unauthorized user`)
      return { success: false, error: "Unauthorized" }
    }

    const user = userData.user

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

    // Hapus cache transaksi
    latestTransactionCache.delete(user.id)

    return { success: true }
  } catch (error: any) {
    console.error("Error in cancel transaction:", error)
    return { success: false, error: error.message || "Internal server error" }
  }
}
