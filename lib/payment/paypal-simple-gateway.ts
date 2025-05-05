import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  CancelTransactionResult,
  PaymentStatus,
} from "./types"

/**
 * Implementasi sederhana PayPal gateway menggunakan Pay Links and Buttons
 */
export class PayPalSimpleGateway implements PaymentGateway {
  name = "paypal"

  /**
   * Membuat transaksi baru dengan PayPal
   * Untuk implementasi sederhana, kita hanya menyimpan data transaksi dan mengembalikan URL PayPal
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      // Konversi harga dari IDR ke USD (asumsi 1 USD = 15000 IDR)
      const amountUSD = (params.amount / 15000).toFixed(2)

      // Buat URL PayPal dengan parameter yang diperlukan
      const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${process.env.PAYPAL_BUSINESS_EMAIL}&item_name=Premium+Membership&item_number=${params.orderId}&amount=${amountUSD}&currency_code=USD&return=${encodeURIComponent(params.successRedirectUrl)}&cancel_return=${encodeURIComponent(params.failureRedirectUrl)}&notify_url=${encodeURIComponent(params.notificationUrl)}`

      return {
        success: true,
        redirectUrl: paypalUrl,
        gatewayReference: params.orderId,
      }
    } catch (error) {
      console.error("Error creating PayPal transaction:", error)
      return {
        success: false,
        error: "Failed to create PayPal transaction",
      }
    }
  }

  /**
   * Memverifikasi status transaksi
   * Untuk implementasi sederhana, kita hanya mengembalikan status berdasarkan parameter
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    // Dalam implementasi sederhana, kita hanya mengembalikan status pending
    // Status sebenarnya akan diperbarui melalui IPN
    return {
      isValid: true,
      status: "pending",
      paymentMethod: "PayPal",
      details: {
        orderId: orderId,
      },
    }
  }

  /**
   * Menangani notifikasi IPN dari PayPal
   */
  async handleNotification(payload: any, headers?: any): Promise<NotificationResult> {
    try {
      // Verifikasi bahwa notifikasi berasal dari PayPal
      // Dalam implementasi sebenarnya, kita perlu memverifikasi dengan mengirim kembali payload ke PayPal

      // Ekstrak data dari payload IPN
      const txnType = payload.txn_type
      const paymentStatus = payload.payment_status?.toLowerCase()
      const orderId = payload.item_number || payload.custom
      const amount = Number.parseFloat(payload.mc_gross || "0")

      // Tentukan status berdasarkan payment_status dari PayPal
      let status: PaymentStatus = "pending"

      if (paymentStatus === "completed" || paymentStatus === "processed") {
        status = "success"
      } else if (paymentStatus === "denied" || paymentStatus === "failed") {
        status = "failed"
      } else if (paymentStatus === "refunded") {
        status = "refunded"
      } else if (paymentStatus === "pending") {
        status = "pending"
      }

      return {
        orderId: orderId,
        status: status,
        isSuccess: status === "success",
        amount: amount * 15000, // Konversi kembali ke IDR
        paymentMethod: "PayPal",
        details: payload,
        eventType: txnType,
      }
    } catch (error) {
      console.error("Error handling PayPal notification:", error)
      throw new Error("Failed to process PayPal notification")
    }
  }

  /**
   * Membatalkan transaksi
   * Untuk PayPal sederhana, kita tidak bisa membatalkan transaksi secara otomatis
   */
  async cancelTransaction(reference: string): Promise<CancelTransactionResult> {
    // PayPal Pay Links tidak mendukung pembatalan otomatis
    return {
      success: false,
      message: "Cancellation not supported for PayPal Pay Links",
      error: "Manual cancellation required",
    }
  }
}
