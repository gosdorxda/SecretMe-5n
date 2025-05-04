"use server"

import { createClient, getVerifiedUser } from "@/lib/supabase/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
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

    // Ambil pengaturan premium dari database atau environment variable
    const { premiumPrice } = await getPremiumSettings()

    console.log(
      `Using premium price: ${premiumPrice} for payment method: ${paymentMethod} with gateway: ${gatewayName}`,
    )

    // Buat ID transaksi unik
    const orderId = `PM-${nanoid(10)}`

    // Buat URL redirect setelah pembayaran
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://secretme.site"
    const successRedirectUrl = `${baseUrl}/premium?status=success&order_id=${orderId}` // Pastikan redirect ke premium
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

// Tambahkan fungsi-fungsi yang hilang di bawah fungsi createTransaction yang sudah ada

// Fungsi untuk mendapatkan transaksi terbaru pengguna
export async function getLatestTransaction() {
  try {
    // Dapatkan user terverifikasi
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return {
        success: false,
        error: "Data pengguna tidak ditemukan. Silakan login kembali.",
      }
    }

    // Ambil transaksi terbaru dari database
    const supabase = createClient()
    const { data, error: txError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (txError) {
      return {
        success: false,
        error: "Tidak ada transaksi ditemukan.",
      }
    }

    return {
      success: true,
      transaction: data,
    }
  } catch (error: any) {
    console.error("Error getting latest transaction:", error)
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengambil data transaksi.",
    }
  }
}

// Fungsi untuk mendapatkan riwayat transaksi pengguna
export async function getTransactionHistory() {
  try {
    // Dapatkan user terverifikasi
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return {
        success: false,
        error: "Data pengguna tidak ditemukan. Silakan login kembali.",
      }
    }

    // Ambil riwayat transaksi dari database
    const supabase = createClient()
    const { data, error: txError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (txError) {
      return {
        success: false,
        error: "Gagal mengambil riwayat transaksi.",
      }
    }

    return {
      success: true,
      transactions: data || [],
    }
  } catch (error: any) {
    console.error("Error getting transaction history:", error)
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengambil riwayat transaksi.",
    }
  }
}

// Fungsi untuk membatalkan transaksi
export async function cancelTransaction(orderId: string) {
  try {
    // Dapatkan user terverifikasi
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return {
        success: false,
        error: "Data pengguna tidak ditemukan. Silakan login kembali.",
      }
    }

    // Periksa apakah transaksi ada dan milik pengguna ini
    const supabase = createClient()
    const { data: transaction, error: txError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("plan_id", orderId)
      .eq("user_id", user.id)
      .single()

    if (txError || !transaction) {
      return {
        success: false,
        error: "Transaksi tidak ditemukan.",
      }
    }

    // Periksa apakah transaksi masih dalam status pending
    if (transaction.status !== "pending") {
      return {
        success: false,
        error: "Hanya transaksi dengan status pending yang dapat dibatalkan.",
      }
    }

    // Update status transaksi menjadi cancelled
    const { error: updateError } = await supabase
      .from("premium_transactions")
      .update({ status: "cancelled" })
      .eq("plan_id", orderId)
      .eq("user_id", user.id)

    if (updateError) {
      return {
        success: false,
        error: "Gagal membatalkan transaksi.",
      }
    }

    return {
      success: true,
      message: "Transaksi berhasil dibatalkan.",
    }
  } catch (error: any) {
    console.error("Error cancelling transaction:", error)
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat membatalkan transaksi.",
    }
  }
}
