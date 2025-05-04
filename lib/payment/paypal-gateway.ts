import type { PaymentGateway, PaymentTransactionRequest, PaymentTransactionResult } from "./types"
import { createPaymentLogger } from "./payment-logger"

interface PayPalOrderResponse {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

export class PayPalGateway implements PaymentGateway {
  private clientId: string
  private clientSecret: string
  private isProduction: boolean
  private baseUrl: string
  private logger = createPaymentLogger("paypal")

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || ""
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
    this.isProduction = process.env.PAYPAL_USE_PRODUCTION === "true"
    this.baseUrl = this.isProduction ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

    this.logger.info("PayPal Gateway initialized", {
      clientId: this.clientId ? "Set (hidden)" : "Not set",
      clientSecret: this.clientSecret ? "Set (hidden)" : "Not set",
      isProduction: this.isProduction,
      environment: this.isProduction ? "PRODUCTION" : "SANDBOX",
    })
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get PayPal access token: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return data.access_token
    } catch (error: any) {
      this.logger.error("Error getting PayPal access token", error)
      throw error
    }
  }

  async createTransaction(request: PaymentTransactionRequest): Promise<PaymentTransactionResult> {
    const requestId = `paypal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    this.logger = createPaymentLogger("paypal", requestId)

    try {
      this.logger.info("Creating new PayPal transaction", {
        userId: request.userId,
        orderId: request.orderId,
        amount: request.amount,
      })

      // Convert IDR to USD (approximate conversion for testing)
      const amountInUSD = (request.amount / 15000).toFixed(2)

      // Create order payload
      const payload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: request.orderId,
            description: request.description,
            amount: {
              currency_code: "USD",
              value: amountInUSD,
            },
          },
        ],
        application_context: {
          brand_name: "SecretMe",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: request.successRedirectUrl,
          cancel_url: request.failureRedirectUrl,
        },
      }

      this.logger.debug("Creating PayPal order with payload", {
        payload: JSON.stringify(payload),
      })

      // Get access token
      const accessToken = await this.getAccessToken()

      // Create order
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

      const data = (await response.json()) as PayPalOrderResponse

      // Find approval URL
      const approvalUrl = data.links.find((link) => link.rel === "approve")?.href

      if (!approvalUrl) {
        this.logger.error("No approval URL found in PayPal response", null, {
          data,
        })
        return {
          success: false,
          error: "No approval URL found in PayPal response",
        }
      }

      this.logger.info("PayPal order created successfully", {
        orderId: data.id,
        status: data.status,
        internalOrderId: request.orderId,
      })

      return {
        success: true,
        redirectUrl: approvalUrl,
        token: data.id,
        gatewayReference: data.id, // PENTING: Pastikan ini diisi dengan PayPal order ID
      }
    } catch (error: any) {
      this.logger.error("Error creating PayPal transaction", error)
      return {
        success: false,
        error: error.message || "Failed to create PayPal transaction",
      }
    }
  }

  async checkOrderStatus(orderId: string): Promise<{
    success: boolean
    status?: string
    details?: any
    error?: string
  }> {
    try {
      // Get access token
      const accessToken = await this.getAccessToken()

      // Check order status
      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to check PayPal order status: ${response.status} ${errorText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        status: data.status,
        details: data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to check PayPal order status",
      }
    }
  }

  async cancelTransaction(orderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // PayPal doesn't have a direct API to cancel an order
      // Orders automatically expire if not completed
      return {
        success: true,
        message: "PayPal orders automatically expire if not completed",
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to cancel PayPal transaction",
      }
    }
  }
}
