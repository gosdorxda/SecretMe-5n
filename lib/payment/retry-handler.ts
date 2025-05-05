type RetryOptions = {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  factor: number
  jitter: boolean
}

const defaultOptions: RetryOptions = {
  maxRetries: 5,
  initialDelay: 1000, // 1 detik
  maxDelay: 30000, // 30 detik
  factor: 2, // exponential factor
  jitter: true, // tambahkan randomness untuk menghindari thundering herd
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  onRetry?: (attempt: number, error: Error, delay: number) => void,
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let attempt = 0
  let delay = opts.initialDelay

  while (true) {
    try {
      return await operation()
    } catch (error: any) {
      attempt++

      // Jika sudah mencapai batas retry atau error tidak bisa di-retry, throw error
      if (attempt >= opts.maxRetries || !isRetryableError(error)) {
        throw error
      }

      // Hitung delay dengan exponential backoff
      delay = Math.min(delay * opts.factor, opts.maxDelay)

      // Tambahkan jitter untuk menghindari thundering herd
      if (opts.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5)
      }

      // Log dan callback
      console.warn(`Retry attempt ${attempt} for PayPal operation after ${delay}ms. Error: ${error.message}`)
      if (onRetry) {
        onRetry(attempt, error, delay)
      }

      // Tunggu sebelum retry
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

// Fungsi untuk menentukan apakah error bisa di-retry
function isRetryableError(error: any): boolean {
  // Network errors bisa di-retry
  if (error.name === "FetchError" || error.name === "NetworkError") {
    return true
  }

  // PayPal rate limiting (429) bisa di-retry
  if (error.status === 429) {
    return true
  }

  // Server errors (5xx) bisa di-retry
  if (error.status && error.status >= 500 && error.status < 600) {
    return true
  }

  // PayPal specific errors yang bisa di-retry
  const retryablePayPalErrors = [
    "INTERNAL_SERVICE_ERROR",
    "GATEWAY_TIMEOUT",
    "SERVICE_UNAVAILABLE",
    "RESOURCE_NOT_FOUND", // Kadang terjadi karena eventual consistency
  ]

  if (error.details && error.details.issue && retryablePayPalErrors.includes(error.details.issue)) {
    return true
  }

  return false
}
