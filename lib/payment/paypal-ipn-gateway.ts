import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  CancelTransactionResult,
} from "./types"
import { createPaymentLogger } from "./logger"

export class PayPalIPNGateway implements PaymentGateway {
  name = "paypal"
  private businessEmail: string
  private isProduction: boolean

  constructor() {
    this.businessEmail = process.env.PAYPAL_BUSINESS_EMAIL || ""
    this.isProduction = process.env.PAYPAL_USE_PRODUCTION === "true"
  }

  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    const logger = createPaymentLogger("paypal")
    logger.info("Creating PayPal transaction", { orderId: params.orderId })

    try {
      // Buat PayPal.me link dengan parameter custom
      // Format: https://www.paypal.com/paypalme/username/amount?custom=userId

      // Pastikan amount dalam format yang benar (tanpa ribuan separator)
      const formattedAmount = params.amount.toString()

      // Buat URL PayPal.me
      const paypalMeUrl = `https://www.paypal.com/paypalme/${this.businessEmail}/${formattedAmount}?custom=${params.userId}`

      logger.info("Generated PayPal.me URL", { url: paypalMeUrl })

      return {
        success: true,
        redirectUrl: paypalMeUrl,
        gatewayReference: params.orderId,
      }
    } catch (error: any) {
      logger.error("Error creating PayPal transaction", error)
      return {
        success: false,
        error: error.message || "Failed to create PayPal transaction",
      }
    }
  }

  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    const logger = createPaymentLogger("paypal")
    logger.info("Verifying PayPal transaction", { orderId })

    // Untuk Pay Links dengan IPN, kita tidak bisa langsung memverifikasi
    // Status akan diupdate melalui IPN
    return {
      isValid: true,
      status: "pending",
      details: { orderId },
    }
  }

  async handleNotification(payload: any): Promise<NotificationResult> {
    const logger = createPaymentLogger("paypal")
    logger.info("Handling PayPal notification")

    try {
      // Untuk IPN, kita sudah memverifikasi di route handler
      // Di sini kita hanya perlu mengekstrak informasi yang relevan

      const orderId = payload.custom || payload.invoice || "unknown"
      const status = this.mapPayPalStatus(payload.payment_status)
      const amount = Number.parseFloat(payload.mc_gross || "0")

      return {
        orderId,
        status,
        isSuccess: status === "success",
        amount,
        paymentMethod: "PayPal",
        details: payload,
      }
    } catch (error: any) {
      logger.error("Error handling PayPal notification", error)
      throw error
    }
  }

  async cancelTransaction(reference: string): Promise<CancelTransactionResult> {
    // PayPal Pay Links tidak mendukung pembatalan melalui API
    return {
      success: false,
      error: "PayPal Pay Links do not support cancellation via API",
    }
  }

  private mapPayPalStatus(
    paypalStatus: string,
  ): "pending" | "success" | "failed" | "expired" | "refunded" | "cancelled" | "unknown" {
    const statusMap: Record<string, any> = {
      Completed: "success",
      Pending: "pending",
      Failed: "failed",
      Denied: "failed",
      Refunded: "refunded",
      Reversed: "refunded",
      Canceled_Reversal: "success",
      Expired: "expired",
      Voided: "cancelled",
    }

    return statusMap[paypalStatus] || "unknown"
  }
}
