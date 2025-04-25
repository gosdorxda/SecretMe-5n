import type { PaymentGateway, CreateTransactionParams, CreateTransactionResult } from "./types"

/**
 * Client-side version of the payment gateway
 * This is a simplified version that only supports redirecting to payment pages
 */
class ClientPaymentGateway implements PaymentGateway {
  name = "client"

  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    try {
      // On the client, we'll make an API call to our server endpoint
      const response = await fetch("/api/payment/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gatewayName: "duitku", // Default to Duitku
          ...params,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to create transaction: ${response.status} ${errorText}`,
        }
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      console.error("Error in client payment gateway:", error)
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      }
    }
  }

  // These methods are not used on the client
  async verifyTransaction(): Promise<any> {
    throw new Error("verifyTransaction is not supported in client gateway")
  }

  async handleNotification(): Promise<any> {
    throw new Error("handleNotification is not supported in client gateway")
  }
}

/**
 * Get a client-side payment gateway
 * This is safe to use in client components
 */
export function getClientGateway(): PaymentGateway {
  return new ClientPaymentGateway()
}
