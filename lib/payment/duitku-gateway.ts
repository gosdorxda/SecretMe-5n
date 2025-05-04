import {
  type PaymentGateway,
  type CreateTransactionParams,
  type CreateTransactionResult,
  type VerifyTransactionResult,
  type NotificationResult,
  type CancelTransactionResult,
  formatPaymentStatus,
} from "./types"
import crypto from "crypto"

export class DuitkuGateway implements PaymentGateway {
  name = "duitku"
  private merchantCode = ""
  private apiKey = ""
  private isProduction = false

  // Daftar metode pembayaran yang didukung
  private supportedPaymentMethods = ["BC", "QR", "OV", "DA"]

  constructor() {
    // This class should only be instantiated on the server
    if (typeof window !== "undefined") {
      throw new Error("DuitkuGateway should only be instantiated on the server")
    }

    // Initialize with environment variables
    this.merchantCode = process.env.DUITKU_MERCHANT_CODE || ""
    this.apiKey = process.env.DUITKU_API_KEY || ""

    // Check if we're in production environment
    const nodeEnv = process.env.NODE_ENV || "development"
    this.isProduction = nodeEnv === "production" && process.env.DUITKU_USE_PRODUCTION === "true"

    console.log("Duitku Gateway initialized with:", {
      merchantCode: this.merchantCode ? "Set (hidden)" : "Not set",
      apiKey: this.apiKey ? "Set (hidden)" : "Not set",
      isProduction: this.isProduction,
      environment: this.isProduction ? "PRODUCTION" : "SANDBOX",
      supportedMethods: this.supportedPaymentMethods,
    })
  }

  /**
   * Mendapatkan base URL API Duitku
   */
  private getBaseUrl(): string {
    if (this.isProduction) {
      return "https://passport.duitku.com/webapi"
    } else {
      return "https://sandbox.duitku.com/webapi"
    }
  }

  /**
   * Validasi metode pembayaran yang dipilih
   * @param paymentMethod Kode metode pembayaran
   * @returns Boolean yang menunjukkan apakah metode pembayaran valid
   */
  private isValidPaymentMethod(paymentMethod: string): boolean {
    return this.supportedPaymentMethods.includes(paymentMethod)
  }

  /**
   * Membuat transaksi baru di Duitku
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      const {
        userEmail,
        userName,
        amount,
        orderId,
        description,
        successRedirectUrl,
        failureRedirectUrl,
        notificationUrl,
        paymentMethod,
      } = params

      // Validasi kredensial
      if (!this.merchantCode || !this.apiKey) {
        console.error("Duitku credentials not set. Please check your environment variables or configuration.")
        return {
          success: false,
          error: "Payment gateway configuration is incomplete. Please contact administrator.",
        }
      }

      // Validasi metode pembayaran
      const selectedPaymentMethod = paymentMethod || "QR"
      if (!this.isValidPaymentMethod(selectedPaymentMethod)) {
        console.error(`Invalid payment method: ${selectedPaymentMethod}. Using default: QR`)
      }

      // Generate signature
      const signature = this.generateSignature(amount, orderId)

      // Prepare payload
      const payload = {
        merchantCode: this.merchantCode,
        paymentAmount: amount,
        merchantOrderId: orderId,
        productDetails: description || "SecretMe Premium Lifetime",
        customerVaName: userName,
        email: userEmail,
        itemDetails: [
          {
            name: description || "SecretMe Premium Lifetime",
            price: amount,
            quantity: 1,
          },
        ],
        callbackUrl: notificationUrl,
        returnUrl: successRedirectUrl,
        expiryPeriod: 60, // 60 menit
        signature: signature,
        paymentMethod: selectedPaymentMethod,
      }

      console.log("Sending request to Duitku API:", {
        url: `${this.getBaseUrl()}/api/merchant/v2/inquiry`,
        merchantCode: this.merchantCode,
        orderId: orderId,
        amount: amount,
        paymentMethod: selectedPaymentMethod,
        baseUrl: this.getBaseUrl(),
        isProduction: this.isProduction,
      })

      // Send request to Duitku
      const response = await fetch(`${this.getBaseUrl()}/api/merchant/v2/inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()
      console.log("Duitku API response:", responseText)

      if (!response.ok) {
        console.error("Duitku API error:", responseText)
        return {
          success: false,
          error: `Failed to create transaction: ${response.status} ${responseText}`,
        }
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse Duitku response:", e)
        return {
          success: false,
          error: "Invalid response from payment gateway",
        }
      }

      if (data.statusCode !== "00") {
        return {
          success: false,
          error: `Duitku error: ${data.statusMessage || "Unknown error"}`,
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
   * Generate MD5 signature for Duitku
   */
  private generateSignature(amount: number, orderId: string): string {
    const signatureString = this.merchantCode + orderId + amount + this.apiKey
    const hash = crypto.createHash("md5").update(signatureString).digest("hex")
    return hash
  }

  /**
   * Verify transaction status with Duitku
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    try {
      console.log(`Verifying transaction with Duitku for order ID: ${orderId}`)

      // Generate signature
      const signature = this.generateSignature(0, orderId)

      // Prepare payload
      const payload = {
        merchantCode: this.merchantCode,
        merchantOrderId: orderId,
        signature: signature,
      }

      console.log("Sending verification request to Duitku:", {
        url: `${this.getBaseUrl()}/api/merchant/transactionStatus`,
        payload: payload,
      })

      // Send request to Duitku
      const response = await fetch(`${this.getBaseUrl()}/api/merchant/transactionStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

      const responseText = await response.text()
      console.log("Duitku verification response:", responseText)

      if (!response.ok) {
        console.error(`Duitku verification failed with status ${response.status}: ${responseText}`)
        return {
          isValid: false,
          status: "unknown",
        }
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse Duitku verification response:", e)
        return {
          isValid: false,
          status: "unknown",
        }
      }

      // Map Duitku status to internal status
      let status = "unknown"
      if (data.statusCode === "00" || data.statusCode === "01") {
        status = "success"
      } else if (data.statusCode === "02") {
        status = "pending"
      } else {
        status = "failed"
      }

      return {
        isValid: true,
        status: formatPaymentStatus(status),
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
   * Handle notification from Duitku
   */
  async handleNotification(payload: any): Promise<NotificationResult> {
    try {
      console.log("Handling Duitku notification:", JSON.stringify(payload))

      // Extract merchantOrderId from payload
      const merchantOrderId = payload.merchantOrderId || payload.order_id

      if (!merchantOrderId) {
        console.error("Missing merchantOrderId in notification payload")
        throw new Error("Missing merchantOrderId in notification payload")
      }

      console.log(`Processing notification for order ID: ${merchantOrderId}`)

      // Attempt to verify transaction with Duitku
      const verificationResult = await this.verifyTransaction(merchantOrderId)

      // Determine status from notification payload
      let status = "unknown"
      const resultCode = payload.resultCode

      if (resultCode === "00" || resultCode === "01") {
        status = "success"
      } else if (resultCode === "02") {
        status = "pending"
      } else {
        status = "failed"
      }

      console.log(`Determined status from notification: ${status}`)

      // Use verification result if valid, otherwise use data from notification
      if (verificationResult.isValid) {
        console.log("Using verification result for transaction details")
        return {
          orderId: merchantOrderId,
          status: verificationResult.status,
          isSuccess: verificationResult.status === "success",
          amount: Number(verificationResult.amount || payload.amount || 0),
          paymentMethod: verificationResult.paymentMethod || payload.paymentCode || "unknown",
          details: verificationResult.details || payload,
        }
      } else {
        console.log("Verification failed, using notification payload for transaction details")
        return {
          orderId: merchantOrderId,
          status: formatPaymentStatus(status),
          isSuccess: status === "success",
          amount: Number(payload.amount || 0),
          paymentMethod: payload.paymentCode || "unknown",
          details: payload,
        }
      }
    } catch (error) {
      console.error("Error handling Duitku notification:", error)
      throw error
    }
  }

  /**
   * Membatalkan transaksi di Duitku
   * @param reference Nomor referensi transaksi Duitku
   */
  async cancelTransaction(reference: string): Promise<CancelTransactionResult> {
    // Buat ID unik untuk request ini
    const requestId = `duitku-cancel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    console.log(`[${requestId}] 🔄 Attempting to cancel Duitku transaction: ${reference}`)

    try {
      // Validasi kredensial
      if (!this.merchantCode || !this.apiKey) {
        console.error(`[${requestId}] ❌ Duitku credentials not set`)
        return {
          success: false,
          error: "Duitku credentials not set. Please check your environment variables or configuration.",
        }
      }

      // Coba verifikasi status transaksi
      console.log(`[${requestId}] 🔍 Checking current transaction status`)
      const verificationResult = await this.verifyTransaction(reference)

      if (!verificationResult.isValid) {
        console.log(`[${requestId}] ⚠️ Could not verify transaction status`)
        return {
          success: false,
          error: "Could not verify transaction status",
        }
      }

      // Periksa status transaksi
      const status = verificationResult.status
      console.log(`[${requestId}] 📊 Current transaction status: ${status}`)

      // Jika transaksi sudah dalam status final, tidak perlu dibatalkan
      if (status === "success" || status === "failed" || status === "expired") {
        console.log(`[${requestId}] ℹ️ Transaction already in final state (${status}), no need to cancel`)
        return {
          success: true,
          message: `Transaction already in final state: ${status}`,
        }
      }

      // Duitku tidak memiliki API resmi untuk membatalkan transaksi
      console.log(`[${requestId}] ℹ️ Transaction is still pending, but Duitku does not support cancellation via API`)
      console.log(`[${requestId}] ℹ️ Transaction will be marked as cancelled in local database only`)

      return {
        success: true,
        message:
          "Transaction marked as cancelled in local database only. Duitku does not support cancellation via API.",
      }
    } catch (error: any) {
      console.error(`[${requestId}] ❌ Error cancelling Duitku transaction:`, error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  }

  /**
   * Mendapatkan daftar metode pembayaran yang didukung
   * @returns Array kode metode pembayaran yang didukung
   */
  getSupportedPaymentMethods(): string[] {
    return this.supportedPaymentMethods
  }
}
