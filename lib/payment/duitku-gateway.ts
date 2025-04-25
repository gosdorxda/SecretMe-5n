import {
  type PaymentGateway,
  type CreateTransactionParams,
  type CreateTransactionResult,
  type VerifyTransactionResult,
  type NotificationResult,
  formatPaymentStatus,
} from "./types"

export class DuitkuGateway implements PaymentGateway {
  name = "duitku"
  private merchantCode = ""
  private apiKey = ""
  private isProduction = false

  constructor() {
    // This class should only be instantiated on the server
    if (typeof window !== "undefined") {
      throw new Error("DuitkuGateway should only be instantiated on the server")
    }

    // Initialize with environment variables
    this.merchantCode = process.env.DUITKU_MERCHANT_CODE || ""
    this.apiKey = process.env.DUITKU_API_KEY || ""
    // Force sandbox URL for testing
    this.isProduction = false

    console.log("Duitku Gateway initialized with:", {
      merchantCode: this.merchantCode ? "Set (hidden)" : "Not set",
      apiKey: this.apiKey ? "Set (hidden)" : "Not set",
      isProduction: this.isProduction,
    })
  }

  /**
   * Mendapatkan base URL API Duitku
   */
  private getBaseUrl(): string {
    // PENTING: Selalu gunakan sandbox URL untuk development
    return "https://sandbox.duitku.com/webapi"
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
      } = params

      // Validasi kredensial
      if (!this.merchantCode || !this.apiKey) {
        console.error("Duitku credentials not set. Please check your environment variables or configuration.")
        return {
          success: false,
          error: "Payment gateway configuration is incomplete. Please contact administrator.",
        }
      }

      // Generate signature
      const signature = this.generateSignature(amount, orderId)

      // Prepare payload
      const payload = {
        merchantCode: this.merchantCode,
        paymentAmount: amount,
        merchantOrderId: orderId,
        productDetails: description,
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
        paymentMethod: "OV", // Set payment method to OVO
      }

      console.log("Sending request to Duitku API:", {
        url: `${this.getBaseUrl()}/api/merchant/v2/inquiry`,
        merchantCode: this.merchantCode,
        orderId: orderId,
        amount: amount,
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
    const crypto = require("crypto")
    const signatureString = this.merchantCode + orderId + amount + this.apiKey
    return crypto.createHash("md5").update(signatureString).digest("hex")
  }

  /**
   * Verify transaction status with Duitku
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    try {
      // Generate signature
      const signature = this.generateSignature(0, orderId)

      // Prepare payload
      const payload = {
        merchantCode: this.merchantCode,
        merchantOrderId: orderId,
        signature: signature,
      }

      // Send request to Duitku
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

      // Map Duitku status to internal status
      let status = "unknown"
      if (data.statusCode === "00" || data.statusCode === "01") {
        status = "success"
      } else if (data.statusCode === "02") {
        status = "pending"
      } else {
        status = "failed"
      }

      console.log("Duitku Verify Transaction Details:", {
        orderId: orderId,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
        amount: data.amount,
        paymentMethod: data.paymentCode,
        details: data,
      })

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
      // Verify notification with Duitku
      const { isValid, status, amount, paymentMethod, details } = await this.verifyTransaction(payload.merchantOrderId)

      if (!isValid) {
        throw new Error("Invalid transaction in notification")
      }

      console.log("Duitku Handle Notification Details:", {
        orderId: payload.merchantOrderId,
        statusCode: payload.statusCode,
        statusMessage: payload.statusMessage,
        amount: Number(amount),
        paymentMethod: paymentMethod,
        details: details,
      })

      return {
        orderId: payload.merchantOrderId,
        status,
        isSuccess: status === "success",
        amount: Number(amount),
        paymentMethod,
        details,
      }
    } catch (error) {
      console.error("Error handling Duitku notification:", error)
      throw error
    }
  }
}
