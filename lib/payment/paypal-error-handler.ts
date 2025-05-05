import { createPaymentLogger } from "./payment-logger"

export class PayPalError extends Error {
  status?: number
  code?: string
  details?: any
  retryable: boolean

  constructor(
    message: string,
    options: {
      status?: number
      code?: string
      details?: any
      retryable?: boolean
    },
  ) {
    super(message)
    this.name = "PayPalError"
    this.status = options.status
    this.code = options.code
    this.details = options.details
    this.retryable = options.retryable ?? false
  }
}

export function handlePayPalError(error: any, context: string, requestId?: string): PayPalError {
  const logger = createPaymentLogger("paypal-error", requestId)

  // Jika sudah PayPalError, return langsung
  if (error instanceof PayPalError) {
    logger.error(`${context} failed: ${error.message}`, error)
    return error
  }

  // Parse error dari PayPal API
  if (error.response && error.response.data) {
    const paypalError = error.response.data

    // Log error detail
    logger.error(`${context} failed with PayPal API error`, {
      status: error.response.status,
      data: paypalError,
      headers: error.response.headers,
    })

    // Cek tipe error
    if (paypalError.name === "VALIDATION_ERROR") {
      return new PayPalError(`Validation error: ${paypalError.message}`, {
        status: error.response.status,
        code: paypalError.name,
        details: paypalError.details,
        retryable: false,
      })
    }

    if (paypalError.name === "RESOURCE_NOT_FOUND") {
      return new PayPalError(`Resource not found: ${paypalError.message}`, {
        status: error.response.status,
        code: paypalError.name,
        details: paypalError.details,
        retryable: true, // Kadang bisa di-retry karena eventual consistency
      })
    }

    if (paypalError.name === "INTERNAL_SERVER_ERROR") {
      return new PayPalError(`PayPal internal error: ${paypalError.message}`, {
        status: error.response.status,
        code: paypalError.name,
        details: paypalError.details,
        retryable: true,
      })
    }

    // Default PayPal API error
    return new PayPalError(paypalError.message || "Unknown PayPal API error", {
      status: error.response.status,
      code: paypalError.name,
      details: paypalError.details,
      retryable: error.response.status >= 500, // 5xx errors are retryable
    })
  }

  // Network errors
  if (error.request && !error.response) {
    logger.error(`${context} failed with network error`, error)
    return new PayPalError("Network error connecting to PayPal", {
      retryable: true,
    })
  }

  // Fallback untuk error lainnya
  logger.error(`${context} failed with unexpected error`, error)
  return new PayPalError(error.message || "Unexpected error", {
    retryable: false,
  })
}
