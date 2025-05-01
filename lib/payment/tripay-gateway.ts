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
    this.isProduction = process.env.NODE_ENV === "production"
    this.baseUrl = this.isProduction ? "https://tripay.co.id/api" : "https://tripay.co.id/api-sandbox"
  }

  /**
   * Membuat transaksi baru di TriPay
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Map payment method dari UI ke kode TriPay
      const tripayMethod = this.mapPaymentMethodToTriPay(params.paymentMethod || "QR")

      // Siapkan data untuk request ke TriPay
      const payload = {
        method: tripayMethod, // Gunakan hasil mapping
        merchant_ref: params.orderId,
        amount: params.amount,
        customer_name: params.userName || "Pengguna",
        customer_email: params.userEmail || "user@example.com",
        customer_phone: "", // Opsional, bisa ditambahkan jika tersedia
        order_items: [
          {
            name: "Premium Membership",
            price: params.amount,
            quantity: 1,
          },
        ],
        return_url: params.successRedirectUrl,
        expired_time: 24 * 60, // 24 jam dalam menit
        signature: this.generateSignature(params.orderId, params.amount),
      }

      // Kirim request ke TriPay API
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
      console.log("TriPay create transaction response:", data)

      // Periksa apakah transaksi berhasil dibuat
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Gagal membuat transaksi di TriPay")
      }

      // Return hasil transaksi
      return {
        success: true,
        redirectUrl: data.data.checkout_url,
        token: data.data.reference,
        gatewayReference: data.data.reference,
      }
    } catch (error: any) {
      console.error("Error creating TriPay transaction:", error)
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
    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Kirim request ke TriPay API untuk memeriksa status transaksi
      const response = await fetch(`${this.baseUrl}/transaction/detail?reference=${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      const data = await response.json()

      // Log response untuk debugging
      console.log("TriPay verify transaction response:", data)

      // Periksa apakah request berhasil
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Gagal memverifikasi transaksi di TriPay")
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(data.data.status)

      return {
        isValid: true,
        status,
        amount: data.data.amount,
        paymentMethod: data.data.payment_method,
        details: data.data,
      }
    } catch (error: any) {
      console.error("Error verifying TriPay transaction:", error)
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
    try {
      // Validasi signature dari TriPay
      const signature = payload.signature
      const expectedSignature = this.generateCallbackSignature(payload.merchant_ref, payload.status)

      if (signature !== expectedSignature) {
        throw new Error("Invalid signature from TriPay")
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(payload.status)

      return {
        orderId: payload.merchant_ref,
        status,
        isSuccess: status === "success",
        amount: payload.total_amount,
        paymentMethod: payload.payment_method,
        details: payload,
      }
    } catch (error: any) {
      console.error("Error handling TriPay notification:", error)
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
   */
  private mapPaymentMethodToTriPay(uiMethod: string): string {
    const methodMap: Record<string, string> = {
      // Bank Transfer
      BR: "BRIVA",
      M2: "MANDIRIVA",
      I1: "BNIVA",
      BV: "BSIVA",
      BT: "PERMATA",

      // E-Wallet
      QR: "QRIS",
      OV: "OVO",
      SA: "SHOPEEPAY",
      DA: "DANA",
      LF: "LINKAJA",

      // Default
      default: "QRIS",
    }

    return methodMap[uiMethod] || methodMap.default
  }
}
