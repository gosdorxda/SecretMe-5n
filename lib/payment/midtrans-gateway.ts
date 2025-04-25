import {
  type PaymentGateway,
  type CreateTransactionParams,
  type CreateTransactionResult,
  type VerifyTransactionResult,
  type NotificationResult,
  formatPaymentStatus,
} from "./types"

export class MidtransGateway implements PaymentGateway {
  name = "midtrans"
  private serverKey = ""
  private isProduction = false
  private config: any = null

  constructor() {
    // This class should only be instantiated on the server
    if (typeof window !== "undefined") {
      throw new Error("MidtransGateway should only be instantiated on the server")
    }

    // Initialize with environment variables
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || ""
    this.isProduction = process.env.NODE_ENV === "production"
  }

  /**
   * Mendapatkan base URL API Midtrans
   */
  private getBaseUrl(): string {
    return this.isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"
  }

  /**
   * Membuat transaksi baru di Midtrans
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      const {
        userId,
        userEmail,
        userName,
        amount,
        orderId,
        description,
        successRedirectUrl,
        failureRedirectUrl,
        pendingRedirectUrl,
      } = params

      // Siapkan payload untuk Midtrans
      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount,
        },
        customer_details: {
          first_name: userName,
          email: userEmail,
        },
        item_details: [
          {
            id: "premium_lifetime",
            price: amount,
            quantity: 1,
            name: description,
          },
        ],
        callbacks: {
          finish: successRedirectUrl,
          error: failureRedirectUrl,
          pending: pendingRedirectUrl,
        },
        payment_type: "ovo", // Set payment method to OVO
      }

      // Buat Basic Auth untuk Midtrans
      const auth = Buffer.from(`${this.serverKey}:`).toString("base64")

      // Kirim request ke Midtrans
      const response = await fetch(`${this.getBaseUrl()}/v2/snap/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Midtrans API error:", errorText)
        return {
          success: false,
          error: `Failed to create transaction: ${response.status} ${errorText}`,
        }
      }

      const data = await response.json()

      return {
        success: true,
        redirectUrl: data.redirect_url,
        token: data.token,
        gatewayReference: data.token,
      }
    } catch (error: any) {
      console.error("Error creating Midtrans transaction:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  }

  /**
   * Memverifikasi status transaksi di Midtrans
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    try {
      // Buat Basic Auth untuk Midtrans
      const auth = Buffer.from(`${this.serverKey}:`).toString("base64")

      // Kirim request ke Midtrans
      const response = await fetch(`${this.getBaseUrl()}/v2/status/order/${orderId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
        },
      })

      if (!response.ok) {
        return {
          isValid: false,
          status: "unknown",
        }
      }

      const data = await response.json()

      // Map status Midtrans ke status internal
      let status = "unknown"
      if (data.transaction_status === "settlement" || data.transaction_status === "capture") {
        status = "success"
      } else if (data.transaction_status === "pending") {
        status = "pending"
      } else {
        status = "failed"
      }

      console.log("Midtrans Verify Transaction Details:", {
        orderId: orderId,
        transactionStatus: data.transaction_status,
        paymentType: data.payment_type,
        grossAmount: data.gross_amount,
        details: data,
      })

      return {
        isValid: true,
        status: formatPaymentStatus(status),
        amount: data.gross_amount,
        paymentMethod: data.payment_type,
        details: data,
      }
    } catch (error) {
      console.error("Error verifying Midtrans transaction:", error)
      return {
        isValid: false,
        status: "unknown",
      }
    }
  }

  /**
   * Menangani notifikasi webhook dari Midtrans
   */
  async handleNotification(payload: any): Promise<NotificationResult> {
    try {
      // Verifikasi notifikasi dengan mengecek status di Midtrans
      const { isValid, status, amount, paymentMethod, details } = await this.verifyTransaction(payload.order_id)

      if (!isValid) {
        throw new Error("Invalid transaction in notification")
      }

      console.log("Midtrans Handle Notification Details:", {
        orderId: payload.order_id,
        transactionStatus: payload.transaction_status,
        paymentType: paymentMethod,
        grossAmount: Number(amount),
        details: details,
      })

      return {
        orderId: payload.order_id,
        status,
        isSuccess: status === "success",
        amount: Number(amount),
        paymentMethod,
        details,
      }
    } catch (error) {
      console.error("Error handling Midtrans notification:", error)
      throw error
    }
  }
}
