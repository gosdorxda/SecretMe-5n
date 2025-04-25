"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { PaymentGateway } from "@/lib/payment/types"
import { createGateway } from "@/lib/payment/gateway-factory"

// Fungsi untuk membuat transaksi baru
export async function createTransaction(gateway: string) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Dapatkan sesi pengguna
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Anda harus login terlebih dahulu" }
    }

    // Periksa apakah pengguna sudah premium
    const { data: userData } = await supabase.from("users").select("is_premium").eq("id", session.user.id).single()

    if (userData?.is_premium) {
      return { success: false, error: "Anda sudah menjadi pengguna premium" }
    }

    // Periksa apakah pengguna memiliki transaksi pending
    const { data: pendingTransaction } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (pendingTransaction) {
      return {
        success: false,
        error:
          "Anda memiliki transaksi yang sedang diproses. Silakan selesaikan pembayaran atau batalkan transaksi tersebut.",
      }
    }

    // Dapatkan harga premium dari konfigurasi
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

    // Dapatkan data pengguna
    const { data: user } = await supabase.from("users").select("email, name").eq("id", session.user.id).single()

    if (!user) {
      return { success: false, error: "Data pengguna tidak ditemukan" }
    }

    // Buat ID pesanan unik
    const orderId = `ORDER-${session.user.id.substring(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Buat gateway pembayaran
    const paymentGateway: PaymentGateway = createGateway(gateway)

    // URL untuk redirect setelah pembayaran
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const successUrl = `${baseUrl}/premium?status=success&order_id=${orderId}`
    const failureUrl = `${baseUrl}/premium?status=failed&order_id=${orderId}`
    const pendingUrl = `${baseUrl}/premium?status=pending&order_id=${orderId}`
    const notificationUrl = `${baseUrl}/api/payment/notification`

    // Buat transaksi di gateway pembayaran
    const transactionResult = await paymentGateway.createTransaction({
      userId: session.user.id,
      userEmail: user.email || session.user.email,
      userName: user.name || "User",
      amount: premiumPrice,
      orderId: orderId,
      description: "SecretMe Premium Lifetime",
      successRedirectUrl: successUrl,
      failureRedirectUrl: failureUrl,
      pendingRedirectUrl: pendingUrl,
      notificationUrl: notificationUrl,
    })

    if (!transactionResult.success) {
      return { success: false, error: transactionResult.error || "Gagal membuat transaksi" }
    }

    // Simpan transaksi ke database
    const { error: insertError } = await supabase.from("premium_transactions").insert({
      user_id: session.user.id,
      order_id: orderId,
      amount: premiumPrice,
      status: "pending",
      gateway: gateway,
      gateway_reference: transactionResult.gatewayReference || null,
      redirect_url: transactionResult.redirectUrl || null,
    })

    if (insertError) {
      console.error("Error inserting transaction:", insertError)
      return { success: false, error: "Gagal menyimpan transaksi ke database" }
    }

    // Kembalikan URL redirect ke halaman pembayaran
    return {
      success: true,
      redirectUrl: transactionResult.redirectUrl,
    }
  } catch (error: any) {
    console.error("Error creating transaction:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat membuat transaksi" }
  }
}

// Fungsi untuk mendapatkan transaksi terbaru
export async function getLatestTransaction() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Dapatkan sesi pengguna
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Anda harus login terlebih dahulu" }
    }

    // Periksa apakah pengguna sudah premium
    const { data: userData } = await supabase.from("users").select("is_premium").eq("id", session.user.id).single()

    if (userData?.is_premium) {
      return { success: true, isPremium: true }
    }

    // Dapatkan transaksi terbaru
    const { data: transaction } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!transaction) {
      return { success: true, hasTransaction: false }
    }

    // Format transaksi untuk client
    const formattedTransaction = {
      id: transaction.id,
      orderId: transaction.order_id,
      status: transaction.status,
      amount: transaction.amount,
      paymentMethod: transaction.payment_method || "",
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      gateway: transaction.gateway,
    }

    return { success: true, hasTransaction: true, transaction: formattedTransaction }
  } catch (error: any) {
    console.error("Error getting latest transaction:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat mendapatkan transaksi" }
  }
}

// Fungsi untuk mendapatkan riwayat transaksi
export async function getTransactionHistory() {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Dapatkan sesi pengguna
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Anda harus login terlebih dahulu" }
    }

    // Dapatkan semua transaksi pengguna
    const { data: transactions, error } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
      return { success: false, error: "Gagal mendapatkan riwayat transaksi" }
    }

    // Format transaksi untuk client
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      orderId: transaction.order_id,
      status: transaction.status,
      amount: transaction.amount,
      paymentMethod: transaction.payment_method || "",
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      gateway: transaction.gateway,
    }))

    return { success: true, transactions: formattedTransactions }
  } catch (error: any) {
    console.error("Error getting transaction history:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat mendapatkan riwayat transaksi" }
  }
}

// Fungsi untuk membatalkan transaksi
export async function cancelTransaction(transactionId: string) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Dapatkan sesi pengguna
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Anda harus login terlebih dahulu" }
    }

    // Periksa apakah transaksi milik pengguna
    const { data: transaction } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", session.user.id)
      .single()

    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan" }
    }

    // Hanya transaksi dengan status pending yang bisa dibatalkan
    if (transaction.status !== "pending") {
      return { success: false, error: "Hanya transaksi dengan status pending yang dapat dibatalkan" }
    }

    // Update status transaksi menjadi cancelled
    const { error: updateError } = await supabase
      .from("premium_transactions")
      .update({ status: "cancelled" })
      .eq("id", transactionId)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return { success: false, error: "Gagal membatalkan transaksi" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error cancelling transaction:", error)
    return { success: false, error: error.message || "Terjadi kesalahan saat membatalkan transaksi" }
  }
}
