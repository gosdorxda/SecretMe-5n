import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  CancelTransactionResult,
  PaymentStatus,
} from "./types"
import { createPaymentLogger } from "./logger"

/**
 * PayPal Gateway Implementation
 * Menggunakan PayPal Pay Link and Button untuk pembayaran
 */
export class PayPalGateway implements PaymentGateway {
  name = "paypal"
  private logger = createPaymentLogger("paypal")
  private clientId: string
  private clientSecret: string
  private isProduction: boolean
  private webhookId: string

  constructor() {
    // Ambil konfigurasi dari environment variables
    this.clientId = process.env.PAYPAL_CLIENT_ID || ""
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
    this.webhookId = process.env.PAYPAL_WEBHOOK_ID || ""
    this.isProduction = process.env.PAYPAL_USE_PRODUCTION === "true"

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn("PayPal credentials not configured properly")
    }
  }

  /**
   * Mendapatkan base URL PayPal berdasarkan mode (production/sandbox)
   */
  private getBaseUrl(): string {
    return this.isProduction ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
  }

  /**
   * Mendapatkan token akses PayPal
   */
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")
      const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
      })

      const data = await response.json()
      if (!response.ok) {
        this.logger.error("Failed to get PayPal access token", data)
        throw new Error("Failed to get PayPal access token")
      }

      return data.access_token
    } catch (error) {
      this.logger.error("Error getting PayPal access token", error)
      throw error
    }
  }

  /**
   * Membuat transaksi PayPal
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      this.logger.info("Creating PayPal transaction", {
        orderId: params.orderId,
        amount: params.amount,
      })

      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Buat order di PayPal
      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: params.orderId,
              description: params.description,
              amount: {
                currency_code: "USD", // PayPal menggunakan USD
                value: (params.amount / 15000).toFixed(2), // Konversi dari IDR ke USD (estimasi)
              },
              custom_id: params.userId,
            },
          ],
          application_context: {
            brand_name: "SecretMe",
            landing_page: "BILLING",
            user_action: "PAY_NOW",
            return_url: params.successRedirectUrl,
            cancel_url: params.failureRedirectUrl,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        this.logger.error("Failed to create PayPal order", data)
        return {
          success: false,
          error: `PayPal error: ${data.message || "Unknown error"}`,
        }
      }

      // Cari link approval URL
      const approvalLink = data.links.find((link: any) => link.rel === "approve")
      if (!approvalLink) {
        this.logger.error("No approval link found in PayPal response", data)
        return {
          success: false,
          error: "No approval link found in PayPal response",
        }
      }

      this.logger.info("PayPal transaction created successfully", {
        paypalOrderId: data.id,
        status: data.status,
      })

      return {
        success: true,
        redirectUrl: approvalLink.href,
        token: data.id,
        gatewayReference: data.id,
      }
    } catch (error) {
      this.logger.error("Error creating PayPal transaction", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error creating PayPal transaction",
      }
    }
  }

  /**
   * Verifikasi status transaksi PayPal
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    try {
      this.logger.info("Verifying PayPal transaction", { orderId })

      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Cari order di database lokal untuk mendapatkan PayPal order ID
      // Dalam implementasi nyata, Anda perlu menyimpan PayPal order ID saat membuat transaksi
      // Untuk contoh ini, kita asumsikan orderId adalah PayPal order ID

      // Periksa status order di PayPal
      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        this.logger.error("Failed to verify PayPal order", data)
        return {
          isValid: false,
          status: "unknown",
        }
      }

      // Tentukan status berdasarkan respons PayPal
      let status: PaymentStatus = "unknown"

      switch (data.status) {
        case "COMPLETED":
        case "APPROVED":
          status = "success"
          break
        case "SAVED":
        case "CREATED":
        case "PAYER_ACTION_REQUIRED":
          status = "pending"
          break
        case "VOIDED":
        case "DECLINED":
          status = "failed"
          break
        default:
          status = "unknown"
      }

      this.logger.info("PayPal transaction verification result", {
        orderId,
        paypalStatus: data.status,
        mappedStatus: status,
      })

      return {
        isValid: true,
        status,
        amount: data.purchase_units[0]?.amount?.value
          ? Number.parseFloat(data.purchase_units[0].amount.value) * 15000 // Konversi USD ke IDR
          : undefined,
        paymentMethod: "PayPal",
        details: data,
      }
    } catch (error) {
      this.logger.error("Error verifying PayPal transaction", error)
      return {
        isValid: false,
        status: "unknown",
      }
    }
  }

  /**
   * Menangani notifikasi webhook dari PayPal
   */
  async handleNotification(payload: any, headers?: Record<string, string>): Promise<NotificationResult> {
    try {
      this.logger.info("Received PayPal notification", {
        eventType: payload.event_type,
      })

      // Verifikasi webhook signature jika tersedia
      if (this.webhookId && headers) {
        const isValid = await this.verifyWebhookSignature(payload, headers)
        if (!isValid) {
          this.logger.warn("Invalid PayPal webhook signature")
          throw new Error("Invalid webhook signature")
        }
      }

      // Ekstrak informasi dari payload
      const resource = payload.resource
      if (!resource) {
        throw new Error("Invalid notification payload: missing resource")
      }

      // Tentukan status berdasarkan event type dan resource state
      let status: PaymentStatus = "unknown"
      let isSuccess = false

      switch (payload.event_type) {
        case "CHECKOUT.ORDER.APPROVED":
          status = "success"
          isSuccess = true
          break
        case "PAYMENT.CAPTURE.COMPLETED":
          status = "success"
          isSuccess = true
          break
        case "PAYMENT.CAPTURE.DENIED":
        case "PAYMENT.CAPTURE.DECLINED":
          status = "failed"
          break
        case "PAYMENT.CAPTURE.REFUNDED":
          status = "refunded"
          break
        case "CHECKOUT.ORDER.COMPLETED":
          status = "success"
          isSuccess = true
          break
        default:
          status = "pending"
      }

      // Ekstrak order ID dari custom_id atau reference_id
      const orderId =
        resource.purchase_units?.[0]?.reference_id ||
        resource.purchase_units?.[0]?.custom_id ||
        resource.id ||
        "unknown"

      // Ekstrak jumlah pembayaran
      const amount = resource.purchase_units?.[0]?.amount?.value
        ? Number.parseFloat(resource.purchase_units[0].amount.value) * 15000 // Konversi USD ke IDR
        : 0

      this.logger.info("Processed PayPal notification", {
        orderId,
        status,
        isSuccess,
      })

      return {
        orderId,
        status,
        isSuccess,
        amount,
        paymentMethod: "PayPal",
        details: resource,
        eventType: payload.event_type,
      }
    } catch (error) {
      this.logger.error("Error handling PayPal notification", error)
      throw error
    }
  }

  /**
   * Verifikasi signature webhook PayPal
   */
  private async verifyWebhookSignature(payload: any, headers: Record<string, string>): Promise<boolean> {
    try {
      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Verifikasi signature
      const response = await fetch(`${this.getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          webhook_id: this.webhookId,
          webhook_event: payload,
          cert_url: headers["paypal-cert-url"],
          transmission_id: headers["paypal-transmission-id"],
          transmission_time: headers["paypal-transmission-time"],
          transmission_sig: headers["paypal-transmission-sig"],
        }),
      })

      const data = await response.json()

      return data.verification_status === "SUCCESS"
    } catch (error) {
      this.logger.error("Error verifying PayPal webhook signature", error)
      return false
    }
  }

  /**
   * Membatalkan transaksi PayPal
   */
  async cancelTransaction(reference: string): Promise<CancelTransactionResult> {
    try {
      this.logger.info("Cancelling PayPal transaction", { reference })

      // Dapatkan token akses
      const accessToken = await this.getAccessToken()

      // Batalkan order di PayPal
      const response = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${reference}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify([
          {
            op: "replace",
            path: "/intent",
            value: "VOID",
          },
        ]),
      })

      if (!response.ok) {
        const errorData = await response.json()
        this.logger.error("Failed to cancel PayPal transaction", errorData)
        return {
          success: false,
          error: `PayPal error: ${errorData.message || "Unknown error"}`,
        }
      }

      this.logger.info("PayPal transaction cancelled successfully", { reference })

      return {
        success: true,
        message: "Transaction cancelled successfully",
      }
    } catch (error) {
      this.logger.error("Error cancelling PayPal transaction", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error cancelling PayPal transaction",
      }
    }
  }
}
