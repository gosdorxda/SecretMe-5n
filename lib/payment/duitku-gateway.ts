import {
  type PaymentGateway,
  type CreateTransactionParams,
  type CreateTransactionResult,
  type VerifyTransactionResult,
  type NotificationResult,
  formatPaymentStatus,
} from "./types"
import { getPaymentConfig } from "./gateway-factory"

export class DuitkuGateway implements PaymentGateway {
  name = "duitku"
  private merchantCode = ""
  private apiKey = ""
  private isProduction = true
  private config: any = null

  constructor() {
    // Konfigurasi akan diinisialisasi saat diperlukan
  }

  /**
   * Inisialisasi konfigurasi Duitku
   */
  private async initialize() {
    if (this.config) return

    const config = await getPaymentConfig()
    const duitkuConfig = config.gateways?.duitku || {}

    this.merchantCode = duitkuConfig.merchantCode || process.env.DUITKU_MERCHANT_CODE || ""
    this.apiKey = duitkuConfig.apiKey || process.env.DUITKU_API_KEY || ""
    this.isProduction = duitkuConfig.isProduction !== false

    if (!this.merchantCode || !this.apiKey) {
      throw new Error("Duitku configuration is incomplete. Please check your settings.")
    }

    this.config = duitkuConfig
  }

  /**
   * Mendapatkan base URL API Duitku
   */
  private getBaseUrl(): string {
    return this.isProduction ? "https://passport.duitku.com/webapi" : "https://sandbox.duitku.com/webapi"
  }

  /**
   * Membuat signature untuk request Duitku
   */
  private createSignature(merchantCode: string, amount: number, merchantOrderId: string): string {
    const md5 = require("crypto").createHash("md5")
    const signatureComponent = merchantCode + amount + merchantOrderId + this.apiKey
    return md5.update(signatureComponent).digest("hex")
  }

  /**
   * Membuat transaksi baru di Duitku
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      await this.initialize()

      const {
        userId,
        userEmail,
        userName,
        amount,
        orderId,
        description,
        successRedirectUrl,
        failureRedirectUrl,
        notificationUrl,
      } = params

      // Buat signature untuk keamanan
      const signature = this.createSignature(this.merchantCode, amount, orderId)

      // Siapkan payload untuk Duitku
      const payload = {
        merchantCode: this.merchantCode,
        paymentAmount: amount,
        merchantOrderId: orderId,
        productDetails: description,
        customerVaName: userName,
        email: userEmail,
        itemDetails: [
          {
            name: "SecretMe Premium Lifetime",
            price: amount,
            quantity: 1,
          },
        ],
        callbackUrl: notificationUrl,
        returnUrl: successRedirectUrl,
        expiryPeriod: 60, // 60 menit
        signature: signature,
      }

      // Kirim request ke Duitku
      const response = await fetch(`${this.getBaseUrl()}/api/merchant/v2/inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Duitku API error:", errorText)
        return {
          success: false,
          error: `Failed to create transaction: ${response.status} ${errorText}`,
        }
      }

      const data = await response.json()

      if (data.statusCode !== "00") {
        return {
          success: false,
          error: data.statusMessage || "Failed to create transaction",
        }
      }

      return {
        success: true,
        redirectUrl: data.paymentUrl,
        token: data.reference,
        gatewayReference: data.reference,
      }
    } catch (error: any) {
      console.error("Error creating Duitku transaction:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  }

  /**
   * Memverifikasi status transaksi di Duitku
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    try {
      await this.initialize()

      // Buat signature untuk keamanan
      const signature = this.createSignature(this.merchantCode, 0, orderId)

      // Siapkan payload untuk Duitku
      const payload = {
        merchantCode: this.merchantCode,
        merchantOrderId: orderId,
        signature: signature,
      }

      // Kirim request ke Duitku
      const response = await fetch(`${this.getBaseUrl()}/api/merchant/transactionStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        return {
          isValid: false,
          status: "unknown",
        }
      }

      const data = await response.json()

      return {
        isValid: true,
        status: formatPaymentStatus(
          data.statusCode === "00" ? "success" : data.statusCode === "01" ? "pending" : "failed",
        ),
        amount: data.amount,
        paymentMethod: data.paymentCode,
        details: data,
      }
    } catch (error) {
      console.error("Error verifying Duitku transaction:", error)
      return {
        isValid: false,
        status: "unknown",
      }
    }
  }

  /**
   * Menangani notifikasi webhook dari Duitku
   */
  async handleNotification(payload: any): Promise<NotificationResult> {
    try {
      await this.initialize()

      // Validasi signature dari notifikasi
      const receivedSignature = payload.signature
      const calculatedSignature = this.createSignature(payload.merchantCode, payload.amount, payload.merchantOrderId)

      if (receivedSignature !== calculatedSignature) {
        throw new Error("Invalid signature in notification")
      }

      return {
        orderId: payload.merchantOrderId,
        status: formatPaymentStatus(payload.resultCode),
        isSuccess: payload.resultCode === "00",
        amount: payload.amount,
        paymentMethod: payload.paymentCode,
        details: payload,
      }
    } catch (error) {
      console.error("Error handling Duitku notification:", error)
      throw error
    }
  }
}
