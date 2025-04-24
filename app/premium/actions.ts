"use server"

import { createClient } from "@/lib/supabase/server"
import { getMidtransSnapApiUrl, getMidtransAuthHeader, generateOrderId } from "@/lib/midtrans"

export async function createTransaction() {
  try {
    const supabase = createClient()

    // Cek apakah user sudah login
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: "Anda harus login terlebih dahulu",
      }
    }

    // Cek apakah user sudah premium
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_premium, username, email, display_name")
      .eq("id", user.id)
      .single()

    if (userError) {
      return {
        success: false,
        error: "Gagal mendapatkan data user",
      }
    }

    if (userData.is_premium) {
      return {
        success: false,
        error: "Anda sudah memiliki akun premium",
      }
    }

    // Ambil harga premium dari environment variable
    const premiumPrice = process.env.PREMIUM_PRICE
    if (!premiumPrice) {
      return {
        success: false,
        error: "Konfigurasi harga tidak ditemukan",
      }
    }

    // Buat ID transaksi unik
    const orderId = generateOrderId(user.id)

    // Buat transaksi di database
    const { error: transactionError } = await supabase.from("premium_transactions").insert({
      id: orderId,
      user_id: user.id,
      amount: Number.parseInt(premiumPrice),
      status: "pending",
      payment_method: null,
      payment_details: null,
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      return {
        success: false,
        error: "Gagal membuat transaksi",
      }
    }

    // Buat transaksi di Midtrans menggunakan fungsi yang tersedia
    const customerName = userData.display_name || userData.username || "Customer"
    const customerEmail = userData.email || user.email || ""
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    // Siapkan data transaksi untuk Midtrans
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number.parseInt(premiumPrice),
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },
      item_details: [
        {
          id: "premium-lifetime",
          price: Number.parseInt(premiumPrice),
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

    // Dapatkan URL dan header untuk API Midtrans
    const snapApiUrl = getMidtransSnapApiUrl()
    const authHeader = getMidtransAuthHeader()

    // Kirim request ke Midtrans Snap API
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
      const errorData = await midtransResponse.text()
      console.error("Midtrans error:", errorData)

      // Jika gagal, update status transaksi menjadi failed
      await supabase
        .from("premium_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", orderId)

      return {
        success: false,
        error: "Gagal membuat transaksi pembayaran",
      }
    }

    const midtransData = await midtransResponse.json()

    if (!midtransData.redirect_url) {
      // Jika tidak ada redirect_url, update status transaksi menjadi failed
      await supabase
        .from("premium_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", orderId)

      return {
        success: false,
        error: "Gagal mendapatkan URL pembayaran",
      }
    }

    // Kembalikan URL redirect ke halaman pembayaran Midtrans
    return {
      success: true,
      redirectUrl: midtransData.redirect_url,
    }
  } catch (error: any) {
    console.error("Create transaction error:", error)
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat membuat transaksi",
    }
  }
}
