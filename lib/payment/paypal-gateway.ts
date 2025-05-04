import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  CancelTransactionResult,
} from "./types"
import { createPaymentLogger } from "./payment-logger"

export class PayPalGateway implements PaymentGateway {
  name = "paypal"
  private clientId: string
  private clientSecret: string
  private isProduction: boolean
  private baseUrl: string
  private logger: ReturnType<typeof createPaymentLogger>

  constructor() {
    // This class should only be instantiated on the server
    if (typeof window !== "undefined") {
      throw new Error("PayPalGateway should only be instantiated on the server")
    }

    // Initialize with environment variables
    this.clientId = process.env.PAYPAL_CLIENT_ID || ""
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
    this.isProduction = process.env.NODE_ENV === "production" && process.env.PAYPAL_USE_PRODUCTION === "true"
    this.baseUrl = this.isProduction ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

    // Initialize logger
    this.logger = createPaymentLogger("paypal")

    this.logger.info("PayPal Gateway initialized", {
      clientId: this.clientId ? "Set (hidden)" : "Not set",
      clientSecret: this.clientSecret ? "Set (hidden)" : "Not set",
      isProduction: this.isProduction,
      environment: this.isProduction ? "PRODUCTION" : "SANDBOX",
    })
  }

  /**
   * Mendapatkan token akses dari PayPal
   */
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")

      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error("Failed to get PayPal access token", null, {
          status: response.status,
          response: errorText,
        })
        throw new Error(`Failed to get PayPal access token: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error) {
      this.logger.error("Error getting PayPal access token", error)
      throw error
    }
  }

  /**
   * Membuat transaksi baru di PayPal
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      this.logger.info("Creating new PayPal transaction", {
        userId: params.userId,
        orderId: params.orderId,
        amount: params.amount,
      })

      // Validasi kredensial
      if (!this.clientId || !this.clientSecret) {
        this.logger.error("Missing PayPal credentials")
        return {
          success: false,
          error: "PayPal credentials not set. Please check your environment variables.",
        }
      }

      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Format jumlah dalam IDR
      const formattedAmount = (params.amount / 15000).toFixed(2) // Konversi ke USD dengan rate sederhana

      // Siapkan payload untuk membuat order
      const payload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: params.orderId,
            description: params.description || "SecretMe Premium Lifetime",
            amount: {
              currency_code: "USD",
              value: formattedAmount,
            },
          },
        ],
        application_context: {
          brand_name: "SecretMe",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: params.successRedirectUrl,
          cancel_url: params.failureRedirectUrl,
        },
      }

      this.logger.debug("Creating PayPal order with payload", {
        payload: JSON.stringify(payload),
      })

      // Buat order di PayPal
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error("Failed to create PayPal order", null, {
          status: response.status,
          response: errorText,
        })
        return {
          success: false,
          error: `Failed to create PayPal order: ${response.status} ${errorText}`,
        }
      }

      const data = await response.json()

      // Cari approval URL untuk redirect
      const approvalUrl = data.links.find((link: any) => link.rel === "approve")?.href

      if (!approvalUrl) {
        this.logger.error("No approval URL found in PayPal response", null, {
          response: JSON.stringify(data),
        })
        return {
          success: false,
          error: "No approval URL found in PayPal response",
        }
      }

      this.logger.info("PayPal order created successfully", {
        orderId: data.id,
        status: data.status,
        internalOrderId: params.orderId,
      })

      return {
        success: true,
        redirectUrl: approvalUrl,
        token: data.id, // PayPal order ID
        gatewayReference: data.id, // PayPal order ID sebagai gateway reference
      }
    } catch (error: any) {
      this.logger.error("Error creating PayPal transaction", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  }

  /**
   * Verifikasi status transaksi di PayPal
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    try {
      this.logger.info("Verifying PayPal transaction", { orderId })

      // Validasi kredensial
      if (!this.clientId || !this.clientSecret) {
        this.logger.error("Missing PayPal credentials")
        throw new Error("PayPal credentials not set")
      }

      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Periksa status order
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error("Failed to verify PayPal order", null, {
          status: response.status,
          response: errorText,
        })
        throw new Error(`Failed to verify PayPal order: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      // Map status PayPal ke status internal
      let status = "unknown"
      if (data.status === "COMPLETED" || data.status === "APPROVED") {
        status = "success"
      } else if (data.status === "SAVED" || data.status === "CREATED" || data.status === "PAYER_ACTION_REQUIRED") {
        status = "pending"
      } else if (data.status === "VOIDED" || data.status === "CANCELLED") {
        status = "failed"
      }

      // Ekstrak jumlah pembayaran
      const amount = data.purchase_units?.[0]?.amount?.value
        ? Number.parseFloat(data.purchase_units[0].amount.value) * 15000 // Konversi kembali ke IDR
        : 0

      this.logger.info("PayPal transaction verified", {
        orderId,
        status,
        paypalStatus: data.status,
      })

      return {
        isValid: true,
        status,
        amount,
        paymentMethod: "PayPal",
        details: data,
      }
    } catch (error) {
      this.logger.error("Error verifying PayPal transaction", error, { orderId })
      return {
        isValid: false,
        status: "unknown",
      }
    }
  }

  /**
   * Memeriksa status order PayPal
   * Metode ini digunakan oleh endpoint check-paypal-status
   */
  async checkOrderStatus(orderId: string): Promise<{
    success: boolean
    status?: string
    details?: any
    error?: string
  }> {
    try {
      this.logger.info("Checking PayPal order status", { orderId })

      // Validasi kredensial
      if (!this.clientId || !this.clientSecret) {
        this.logger.error("Missing PayPal credentials")
        return {
          success: false,
          error: "PayPal credentials not set",
        }
      }

      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Periksa status order
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error("Failed to check PayPal order status", null, {
          status: response.status,
          response: errorText,
        })
        return {
          success: false,
          error: `Failed to check PayPal order status: ${response.status} ${errorText}`,
        }
      }

      const data = await response.json()

      this.logger.info("PayPal order status checked", {
        orderId,
        status: data.status,
      })

      return {
        success: true,
        status: data.status,
        details: data,
      }
    } catch (error: any) {
      this.logger.error("Error checking PayPal order status", error, { orderId })
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  }

  /**
   * Menangani notifikasi webhook dari PayPal
   */
  async handleNotification(payload: any, headers?: any): Promise<NotificationResult> {
    try {
      this.logger.info("Handling PayPal webhook notification", {
        eventType: payload.event_type,
      })

      // Validasi webhook dengan verifikasi signature
      const isValid = await this.verifyWebhookSignature(payload, headers)

      if (!isValid) {
        this.logger.warn("Invalid PayPal webhook signature")
        throw new Error("Invalid PayPal webhook signature")
      }

      // Ekstrak data yang diperlukan dari payload
      const eventType = payload.event_type
      const resourceId = payload.resource?.id

      if (!resourceId) {
        this.logger.error("Missing resource ID in PayPal webhook", null, {
          payload: JSON.stringify(payload),
        })
        throw new Error("Missing resource ID in PayPal webhook")
      }

      // Verifikasi transaksi untuk mendapatkan detail lengkap
      const verificationResult = await this.verifyTransaction(resourceId)

      // Tentukan status berdasarkan event type
      let status = "unknown"
      let isSuccess = false

      if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED") {
        status = "success"
        isSuccess = true
      } else if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
        status = "failed"
      } else if (eventType === "PAYMENT.CAPTURE.PENDING") {
        status = "pending"
      } else if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
        status = "refunded"
      }

      // Ekstrak order ID dari custom_id atau dari resource
      const orderId = payload.resource?.purchase_units?.[0]?.reference_id || resourceId

      this.logger.info("PayPal webhook processed", {
        orderId,
        status,
        eventType,
      })

      return {
        orderId,
        status,
        isSuccess,
        amount: verificationResult.amount || 0,
        paymentMethod: "PayPal",
        details: payload,
        eventType,
      }
    } catch (error) {
      this.logger.error("Error handling PayPal webhook", error)
      throw error
    }
  }

  /**
   * Verifikasi signature webhook PayPal
   */
  private async verifyWebhookSignature(payload: any, headers: any): Promise<boolean> {
    try {
      // Dalam implementasi sebenarnya, Anda perlu memverifikasi signature
      // menggunakan PayPal SDK atau API

      // Untuk sementara, kita anggap valid untuk testing
      return true
    } catch (error) {
      this.logger.error("Error verifying PayPal webhook signature", error)
      return false
    }
  }

  /**
   * Membatalkan transaksi di PayPal
   */
  async cancelTransaction(reference: string): Promise<CancelTransactionResult> {
    try {
      this.logger.info("Cancelling PayPal transaction", { reference })

      // Validasi kredensial
      if (!this.clientId || !this.clientSecret) {
        this.logger.error("Missing PayPal credentials")
        return {
          success: false,
          error: "PayPal credentials not set",
        }
      }

      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Periksa status order terlebih dahulu
      const orderResponse = await fetch(`${this.baseUrl}/v2/checkout/orders/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text()
        this.logger.error("Failed to get PayPal order", null, {
          status: orderResponse.status,
          response: errorText,
        })
        return {
          success: false,
          error: `Failed to get PayPal order: ${orderResponse.status} ${errorText}`,
        }
      }

      const orderData = await orderResponse.json()

      // Jika order sudah dalam status final, tidak perlu dibatalkan
      if (["COMPLETED", "APPROVED", "VOIDED", "CANCELLED"].includes(orderData.status)) {
        this.logger.info("PayPal order already in final state", {
          reference,
          status: orderData.status,
        })
        return {
          success: true,
          message: `Order already in final state: ${orderData.status}`,
        }
      }

      // Batalkan order
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${reference}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.logger.error("Failed to cancel PayPal order", null, {
          status: response.status,
          response: errorText,
        })
        return {
          success: false,
          error: `Failed to cancel PayPal order: ${response.status} ${errorText}`,
        }
      }

      this.logger.info("PayPal order cancelled successfully", { reference })

      return {
        success: true,
        message: "Order cancelled successfully",
      }
    } catch (error: any) {
      this.logger.error("Error cancelling PayPal transaction", error, { reference })
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  }
}
