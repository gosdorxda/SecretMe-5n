import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  PaymentStatus,
} from "./types"

/**
 * Implementasi gateway pembayaran TriPay
 */
export class TriPayGateway implements PaymentGateway {
  name = "tripay"
  private apiKey: string
  private merchantCode: string
  private privateKey: string
  private isProduction: boolean
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.TRIPAY_API_KEY || ""
    this.merchantCode = process.env.TRIPAY_MERCHANT_CODE || ""
    this.privateKey = process.env.TRIPAY_PRIVATE_KEY || ""

    // Gunakan environment variable khusus untuk menentukan mode
    this.isProduction = process.env.TRIPAY_USE_PRODUCTION === "true"

    // Tentukan baseUrl berdasarkan mode
    this.baseUrl = this.isProduction ? "https://tripay.co.id/api" : "https://tripay.co.id/api-sandbox"

    // Log environment setup
    console.log(`[TriPay] Initializing TriPay gateway. Production mode: ${this.isProduction}`)
    console.log(`[TriPay] Using API URL: ${this.baseUrl}`)
    console.log(`[TriPay] Merchant Code: ${this.merchantCode}`)
    console.log(`[TriPay] API Key configured: ${this.apiKey ? "Yes" : "No"}`)
    console.log(`[TriPay] Private Key configured: ${this.privateKey ? "Yes" : "No"}`)
  }

  /**
   * Membuat transaksi baru di TriPay
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    const requestId = `tripay-create-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    console.log(`[${requestId}] 🚀 TriPay: Creating new transaction for user ${params.userId}`)
    console.log(`[${requestId}] 📋 Order ID: ${params.orderId}, Amount: ${params.amount}`)
    console.log(`[${requestId}] 🔧 Using mode: ${this.isProduction ? "PRODUCTION" : "SANDBOX"}`)

    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        console.error(`[${requestId}] ❌ TriPay: Missing API Key or Merchant Code`)
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Map payment method dari UI ke kode TriPay
      const tripayMethod = this.mapPaymentMethodToTriPay(params.paymentMethod || "QR")
      console.log(`[${requestId}] 🔄 TriPay: Mapped payment method from ${params.paymentMethod} to ${tripayMethod}`)

      // Hitung waktu kedaluwarsa (1 jam dari sekarang dalam format Unix timestamp)
      const now = Math.floor(Date.now() / 1000) // Waktu sekarang dalam detik
      const expiredTime = now + 3600 // 1 jam dari sekarang dalam detik (3600 detik = 1 jam)

      console.log(`[${requestId}] ⏱️ Current time (Unix): ${now}`)
      console.log(`[${requestId}] ⏱️ Expiry time (Unix): ${expiredTime}`)
      console.log(`[${requestId}] ⏱️ Expiry duration: ${expiredTime - now} seconds (1 hour)`)

      // Siapkan data untuk request ke TriPay
      const payload = {
        method: tripayMethod, // Gunakan hasil mapping
        merchant_ref: params.orderId,
        amount: params.amount,
        customer_name: params.userName || "Pengguna",
        customer_email: params.userEmail || "user@example.com",
        customer_phone: params.userPhone || "", // Tambahkan nomor telepon jika tersedia
        order_items: [
          {
            name: "Premium Membership",
            price: params.amount,
            quantity: 1,
          },
        ],
        return_url: params.successRedirectUrl,
        expired_time: 3600, // 1 jam dalam detik
        signature: this.generateSignature(params.orderId, params.amount),
      }

      // Log payload untuk debugging
      console.log(`[${requestId}] 📦 TriPay payload:`, JSON.stringify(payload, null, 2))
      console.log(`[${requestId}] 🔐 TriPay signature generated: ${payload.signature.substring(0, 10)}...`)

      // Kirim request ke TriPay API
      console.log(`[${requestId}] 📡 Sending request to TriPay API: ${this.baseUrl}/transaction/create`)
      const response = await fetch(`${this.baseUrl}/transaction/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      // Log response untuk debugging
      console.log(`[${requestId}] ⬅️ TriPay response status: ${response.status}`)
      console.log(`[${requestId}] ⬅️ TriPay response body:`, JSON.stringify(data, null, 2))

      // Periksa apakah transaksi berhasil dibuat
      if (!response.ok || data.success !== true) {
        console.error(`[${requestId}] ❌ TriPay transaction creation failed: ${data.message || "Unknown error"}`)

        // Coba alternatif jika masih error dengan expired_time
        if (data.message && data.message.includes("expired time")) {
          console.log(`[${requestId}] 🔄 Trying alternative approach for expired_time...`)

          // Coba dengan format yang berbeda atau tanpa expired_time
          delete payload.expired_time

          console.log(`[${requestId}] 📦 TriPay payload (alternative):`, JSON.stringify(payload, null, 2))

          const altResponse = await fetch(`${this.baseUrl}/transaction/create`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          const altData = await altResponse.json()

          console.log(`[${requestId}] ⬅️ TriPay alternative response status: ${altResponse.status}`)
          console.log(`[${requestId}] ⬅️ TriPay alternative response body:`, JSON.stringify(altData, null, 2))

          if (altResponse.ok && altData.success === true) {
            // Log success details
            console.log(`[${requestId}] ✅ TriPay transaction created successfully with alternative approach!`)
            console.log(`[${requestId}] 📝 Reference: ${altData.data.reference}`)
            console.log(`[${requestId}] 🔗 Checkout URL: ${altData.data.checkout_url}`)

            return {
              success: true,
              redirectUrl: altData.data.checkout_url,
              token: altData.data.reference,
              gatewayReference: altData.data.reference,
            }
          }
        }

        throw new Error(data.message || "Gagal membuat transaksi di TriPay")
      }

      // Log success details
      console.log(`[${requestId}] ✅ TriPay transaction created successfully!`)
      console.log(`[${requestId}] 📝 Reference: ${data.data.reference}`)
      console.log(`[${requestId}] 🔗 Checkout URL: ${data.data.checkout_url}`)

      // Return hasil transaksi
      return {
        success: true,
        redirectUrl: data.data.checkout_url,
        token: data.data.reference,
        gatewayReference: data.data.reference,
      }
    } catch (error: any) {
      console.error(`[${requestId}] 💥 Error creating TriPay transaction:`, error)
      console.error(`[${requestId}] 📋 Error details:`, error.stack || "No stack trace available")
      return {
        success: false,
        error: error.message || "Gagal membuat transaksi di TriPay",
      }
    }
  }

  /**
   * Memverifikasi status transaksi di TriPay
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    const requestId = `tripay-verify-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    console.log(`[${requestId}] 🔍 TriPay: Verifying transaction with order ID: ${orderId}`)
    console.log(`[${requestId}] 🔧 Using mode: ${this.isProduction ? "PRODUCTION" : "SANDBOX"}`)

    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        console.error(`[${requestId}] ❌ TriPay: Missing API Key or Merchant Code`)
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Kirim request ke TriPay API untuk memeriksa status transaksi
      console.log(
        `[${requestId}] 📡 Sending request to TriPay API: ${this.baseUrl}/transaction/detail?reference=${orderId}`,
      )
      const response = await fetch(`${this.baseUrl}/transaction/detail?reference=${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      const data = await response.json()

      // Log response untuk debugging
      console.log(`[${requestId}] ⬅️ TriPay verify response status: ${response.status}`)
      console.log(`[${requestId}] ⬅️ TriPay verify response body:`, JSON.stringify(data, null, 2))

      // Periksa apakah request berhasil
      if (!response.ok || data.success !== true) {
        console.error(`[${requestId}] ❌ TriPay verification failed: ${data.message || "Unknown error"}`)
        throw new Error(data.message || "Gagal memverifikasi transaksi di TriPay")
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(data.data.status)
      console.log(`[${requestId}] 🔄 TriPay status "${data.data.status}" mapped to internal status "${status}"`)
      console.log(`[${requestId}] ✅ TriPay verification completed successfully`)

      return {
        isValid: true,
        status,
        amount: data.data.amount,
        paymentMethod: data.data.payment_method,
        details: data.data,
      }
    } catch (error: any) {
      console.error(`[${requestId}] 💥 Error verifying TriPay transaction:`, error)
      console.error(`[${requestId}] 📋 Error details:`, error.stack || "No stack trace available")
      return {
        isValid: false,
        status: "unknown",
      }
    }
  }

  /**
   * Menangani notifikasi webhook dari TriPay
   */
  async handleNotification(payload: any): Promise<NotificationResult> {
    const requestId = `tripay-notify-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    console.log(`[${requestId}] 📣 TriPay: Received notification webhook`)
    console.log(`[${requestId}] 🔧 Using mode: ${this.isProduction ? "PRODUCTION" : "SANDBOX"}`)
    console.log(`[${requestId}] 📦 TriPay notification payload:`, JSON.stringify(payload, null, 2))

    try {
      // Validasi signature dari TriPay
      const signature = payload.signature
      const expectedSignature = this.generateCallbackSignature(payload.merchant_ref, payload.status)

      console.log(`[${requestId}] 🔐 TriPay received signature: ${signature}`)
      console.log(`[${requestId}] 🔐 TriPay expected signature: ${expectedSignature}`)
      console.log(`[${requestId}] 🔐 TriPay signature match: ${signature === expectedSignature}`)

      if (signature !== expectedSignature) {
        console.error(`[${requestId}] ❌ TriPay invalid signature!`)
        throw new Error("Invalid signature from TriPay")
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(payload.status)
      console.log(`[${requestId}] 🔄 TriPay status "${payload.status}" mapped to internal status "${status}"`)

      // Log transaction details
      console.log(`[${requestId}] 📋 TriPay merchant_ref: ${payload.merchant_ref}`)
      console.log(`[${requestId}] 📋 TriPay reference: ${payload.reference}`)
      console.log(`[${requestId}] 📋 TriPay payment_method: ${payload.payment_method}`)
      console.log(`[${requestId}] 📋 TriPay amount: ${payload.total_amount}`)
      console.log(`[${requestId}] ✅ TriPay notification processed successfully`)

      return {
        orderId: payload.merchant_ref,
        status,
        isSuccess: status === "success",
        amount: payload.total_amount,
        paymentMethod: payload.payment_method,
        details: payload,
      }
    } catch (error: any) {
      console.error(`[${requestId}] 💥 Error handling TriPay notification:`, error)
      console.error(`[${requestId}] 📋 Error details:`, error.stack || "No stack trace available")
      throw error
    }
  }

  /**
   * Memetakan status dari TriPay ke status internal
   */
  private mapTriPayStatus(tripayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      UNPAID: "pending",
      PAID: "success",
      REFUND: "refunded",
      EXPIRED: "expired",
      FAILED: "failed",
      CANCELED: "failed",
    }

    return statusMap[tripayStatus] || "unknown"
  }

  /**
   * Menghasilkan signature untuk request ke TriPay
   */
  private generateSignature(orderId: string, amount: number): string {
    const crypto = require("crypto")
    const data = `${this.merchantCode}${orderId}${amount}`
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
  }

  /**
   * Menghasilkan signature untuk callback dari TriPay
   */
  private generateCallbackSignature(orderId: string, status: string): string {
    const crypto = require("crypto")
    const data = `${this.merchantCode}${orderId}${status}`
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
  }

  /**
   * Memetakan kode metode pembayaran UI ke kode TriPay
   * Berdasarkan dokumentasi resmi: https://tripay.co.id/developer?tab=merchant-payment-channel
   */
  private mapPaymentMethodToTriPay(uiMethod: string): string {
    // Kode metode pembayaran resmi TriPay
    const methodMap: Record<string, string> = {
      // Virtual Account
      BR: "BRIVA", // BRI Virtual Account
      M2: "MANDIRIVA", // Mandiri Virtual Account
      I1: "BNIVA", // BNI Virtual Account
      BV: "BSIVA", // BSI Virtual Account
      BT: "PERMATAVA", // Permata Virtual Account
      NC: "CIMBVA", // CIMB Virtual Account

      // E-Wallet
      QR: "QRIS", // QRIS by ShopeePay
      OV: "OVO", // OVO
      SA: "SHOPEEPAY", // ShopeePay
      DA: "DANA", // DANA
      LF: "LINKAJA", // LinkAja

      // Convenience Store / Retail
      A1: "ALFAMART", // Alfamart
      IR: "INDOMARET", // Indomaret

      // Default
      default: "QRIS",
    }

    return methodMap[uiMethod] || methodMap.default
  }
}
