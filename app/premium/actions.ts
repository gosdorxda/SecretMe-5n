"use server"

import { createClient } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { generateOrderId } from "@/lib/payment/types"
import { revalidatePath } from "next/cache"
import { validateTransaction } from "@/lib/payment/transaction-validator"
import { withRetry } from "@/lib/payment/retry-handler"

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
export async function createTransaction(paymentMethod: string, gatewayName: string | undefined) {
  try {
    const supabase = createClient()

    // Get premium settings
    const { premiumPrice, activeGateway: defaultGateway } = await getPremiumSettings()

    // Use provided gateway or default
    const finalGatewayName = gatewayName || defaultGateway

    // Verifikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    // Validasi transaksi untuk mencegah duplicate payment
    const validationResult = await validateTransaction(user.id, premiumPrice)
    if (!validationResult.valid) {
      // Handle berbagai alasan validasi gagal
      if (validationResult.reason === "already_premium") {
        return { success: false, error: "Anda sudah menjadi pengguna premium" }
      }

      if (validationResult.reason === "pending_transaction") {
        return {
          success: false,
          error: "Anda memiliki transaksi yang sedang diproses",
          pendingTransaction: validationResult.existingTransaction,
        }
      }

      if (validationResult.reason === "recent_success") {
        return {
          success: false,
          error: "Anda telah berhasil melakukan pembayaran dalam 24 jam terakhir",
          successTransaction: validationResult.existingTransaction,
        }
      }

      if (validationResult.reason === "invalid_amount") {
        return { success: false, error: "Jumlah pembayaran tidak valid" }
      }

      return { success: false, error: "Validasi transaksi gagal" }
    }

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

    // Generate order ID
    const orderId = generateOrderId(session.user.id)

    // Create transaction record with idempotency key to prevent duplicates
    const idempotencyKey = `${session.user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const { data: transaction, error: transactionError } = await supabase
      .from("premium_transactions")
      .insert({
        user_id: session.user.id,
        plan_id: orderId,
        amount: premiumPrice,
        status: "pending",
        payment_gateway: finalGatewayName,
        // Set payment method to "PayPal" if using PayPal gateway
        payment_method: finalGatewayName === "paypal" ? "PayPal" : paymentMethod,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      return { success: false, error: "Gagal membuat catatan transaksi" }
    }

    // Get payment gateway
    const gateway = await getPaymentGateway(finalGatewayName || defaultGateway)

    // Create transaction in payment gateway with retry logic
    const result = await withRetry(
      async () => {
        return await gateway.createTransaction({
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
          paymentMethod: paymentMethod,
        })
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
      },
      (attempt, error, delay) => {
        console.warn(`Retry attempt ${attempt} for creating transaction: ${error.message}`)
      },
    )

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

    // PERBAIKAN: Pastikan gateway_reference selalu diisi dengan ID PayPal
    const gatewayReference = result.gatewayReference || result.token

    // Log transaksi ke payment_notification_logs
    await supabase.from("payment_notification_logs").insert({
      request_id: `create-tx-${Date.now()}`,
      gateway: finalGatewayName,
      raw_payload: {
        action: "create-transaction",
        userId: session.user.id,
        orderId: orderId,
        amount: premiumPrice,
        gatewayReference: gatewayReference,
      },
      status: "created",
      transaction_id: transaction.id,
      order_id: orderId,
      event_type: "transaction-created",
    })

    // Update transaction with gateway_reference
    const { error: updateError } = await supabase
      .from("premium_transactions")
      .update({
        gateway_reference: gatewayReference,
        payment_details: {
          gateway_reference: gatewayReference,
          redirect_url: result.redirectUrl,
          token: result.token,
          created_at: new Date().toISOString(),
          payment_method: paymentMethod,
          gateway: finalGatewayName,
          idempotency_key: idempotencyKey,
        },
      })
      .eq("id", transaction.id)

    if (updateError) {
      console.error("Error updating transaction with gateway_reference:", updateError)
      // Fallback update if gateway_reference column has issues
      await supabase
        .from("premium_transactions")
        .update({
          payment_details: {
            gateway_reference: gatewayReference,
            redirect_url: result.redirectUrl,
            token: result.token,
            created_at: new Date().toISOString(),
            payment_method: paymentMethod,
            gateway: finalGatewayName,
            idempotency_key: idempotencyKey,
          },
        })
        .eq("id", transaction.id)
    }

    // Log untuk debugging
    console.log(`Transaction ${transaction.id} created with gateway_reference: ${gatewayReference}`)

    return {
      success: true,
      redirectUrl: result.redirectUrl,
      orderId: orderId,
      token: result.token,
      gatewayReference: gatewayReference, // Tambahkan gatewayReference ke respons
      transactionId: transaction.id,
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

    // Coba dapatkan gateway_reference dari kolom atau dari payment_details
    let gatewayReference = transactionData.gateway_reference

    if (!gatewayReference && transactionData.payment_details) {
      const details =
        typeof transactionData.payment_details === "string"
          ? JSON.parse(transactionData.payment_details)
          : transactionData.payment_details

      gatewayReference = details?.gateway_reference || details?.token || null
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
      gatewayReference: gatewayReference, // Gunakan gateway_reference yang sudah diambil
      paymentDetails: transactionData.payment_details || {}, // Tambahkan payment_details
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
    const transactions = transactionsData.map((tx) => {
      // Coba dapatkan gateway_reference dari kolom atau dari payment_details
      let gatewayReference = tx.gateway_reference

      if (!gatewayReference && tx.payment_details) {
        const details = typeof tx.payment_details === "string" ? JSON.parse(tx.payment_details) : tx.payment_details

        gatewayReference = details?.gateway_reference || details?.token || null
      }

      return {
        id: tx.id,
        orderId: tx.plan_id,
        status: tx.status,
        amount: tx.amount,
        paymentMethod: tx.payment_method || "",
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        gateway: tx.payment_gateway,
        gatewayReference: gatewayReference, // Gunakan gateway_reference yang sudah diambil
      }
    })

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
    let gatewayReference = transactionData.gateway_reference

    // Jika tidak ada di kolom gateway_reference, coba ambil dari payment_details
    if (!gatewayReference && transactionData.payment_details) {
      const details =
        typeof transactionData.payment_details === "string"
          ? JSON.parse(transactionData.payment_details)
          : transactionData.payment_details

      gatewayReference = details?.gateway_reference || details?.token || null
    }

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

    try {
      // Coba update dengan gateway_reference jika kolom ada
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
          gateway_reference: gatewayReference, // Coba update gateway_reference jika kolom ada
          payment_details: {
            ...transactionData.payment_details,
            gateway_reference: gatewayReference, // Selalu update di payment_details
            cancelled_at: new Date().toISOString(),
            cancelled_by: "user",
          },
        })
        .eq("id", transactionId)

      if (updateError) {
        console.error(`[${requestId}] ⚠️ Error updating with gateway_reference: ${updateError.message}`)

        // Jika gagal karena kolom gateway_reference tidak ada, update tanpa kolom tersebut
        const { error: fallbackUpdateError } = await supabase
          .from("premium_transactions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
            payment_details: {
              ...transactionData.payment_details,
              gateway_reference: gatewayReference, // Selalu update di payment_details
              cancelled_at: new Date().toISOString(),
              cancelled_by: "user",
            },
          })
          .eq("id", transactionId)

        if (fallbackUpdateError) {
          console.error(`[${requestId}] ❌ Failed to update transaction status:`, fallbackUpdateError)
          return { success: false, error: "Failed to cancel transaction" }
        }
      }
    } catch (error: any) {
      console.error(`[${requestId}] ❌ Error updating transaction:`, error)
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
