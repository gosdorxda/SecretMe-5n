/**
 * Utilitas logging untuk sistem pembayaran
 * Menyediakan format yang konsisten dan terstruktur untuk log pembayaran
 */

type LogLevel = "info" | "warn" | "error" | "debug" | "trace"

interface LogMetadata {
  [key: string]: any
}

/**
 * Format timestamp untuk log
 */
function formatTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Format pesan log dengan metadata
 */
function formatLogMessage(
  requestId: string,
  message: string,
  level: LogLevel,
  metadata?: LogMetadata,
  gateway?: string,
): string {
  const gatewayPrefix = gateway ? `[${gateway.toUpperCase()}] ` : ""
  const levelEmoji = getLogLevelEmoji(level)
  const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : ""

  return `[${formatTimestamp()}] [${requestId}] ${levelEmoji} ${gatewayPrefix}${message}${metadataStr}`
}

/**
 * Mendapatkan emoji untuk level log
 */
function getLogLevelEmoji(level: LogLevel): string {
  switch (level) {
    case "info":
      return "ℹ️"
    case "warn":
      return "⚠️"
    case "error":
      return "❌"
    case "debug":
      return "🔍"
    case "trace":
      return "🔬"
    default:
      return "📝"
  }
}

/**
 * Logger untuk sistem pembayaran
 */
export class PaymentLogger {
  private requestId: string
  private gateway?: string

  constructor(requestId: string, gateway?: string) {
    this.requestId = requestId
    this.gateway = gateway
  }

  /**
   * Log informasi
   */
  info(message: string, metadata?: LogMetadata): void {
    console.log(formatLogMessage(this.requestId, message, "info", metadata, this.gateway))
  }

  /**
   * Log peringatan
   */
  warn(message: string, metadata?: LogMetadata): void {
    console.warn(formatLogMessage(this.requestId, message, "warn", metadata, this.gateway))
  }

  /**
   * Log error
   */
  error(message: string, error?: any, metadata?: LogMetadata): void {
    console.error(formatLogMessage(this.requestId, message, "error", metadata, this.gateway))

    if (error) {
      if (error instanceof Error) {
        console.error(`[${this.requestId}] ❌ Error details: ${error.message}`)
        console.error(`[${this.requestId}] ❌ Stack trace: ${error.stack || "No stack trace available"}`)
      } else {
        console.error(`[${this.requestId}] ❌ Error details:`, error)
      }
    }
  }

  /**
   * Log debug
   */
  debug(message: string, metadata?: LogMetadata): void {
    console.log(formatLogMessage(this.requestId, message, "debug", metadata, this.gateway))
  }

  /**
   * Log trace (detail tinggi)
   */
  trace(message: string, metadata?: LogMetadata): void {
    console.log(formatLogMessage(this.requestId, message, "trace", metadata, this.gateway))
  }

  /**
   * Log HTTP request
   */
  logRequest(url: string, method: string, headers: any, body?: any): void {
    this.debug(`HTTP ${method} Request to ${url}`, {
      headers: this.sanitizeHeaders(headers),
      body: this.sanitizePayload(body),
    })
  }

  /**
   * Log HTTP response
   */
  logResponse(url: string, status: number, body: any): void {
    this.debug(`HTTP Response from ${url} (Status: ${status})`, {
      body: this.sanitizePayload(body),
    })
  }

  /**
   * Log transaksi
   */
  logTransaction(action: string, transactionId: string, status: string, details?: any): void {
    this.info(`Transaction ${action}`, {
      transactionId,
      status,
      ...(details && { details: this.sanitizePayload(details) }),
    })
  }

  /**
   * Log event pembayaran
   */
  logPaymentEvent(eventType: string, orderId: string, status: string, details?: any): void {
    this.info(`Payment Event: ${eventType}`, {
      orderId,
      status,
      ...(details && { details: this.sanitizePayload(details) }),
    })
  }

  /**
   * Log validasi signature
   */
  logSignatureValidation(received: string, expected: string, isValid: boolean): void {
    this.debug(`Signature Validation: ${isValid ? "Valid" : "Invalid"}`, {
      received: this.maskString(received),
      expected: this.maskString(expected),
      isValid,
    })
  }

  /**
   * Sanitasi header untuk logging (menghapus informasi sensitif)
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {}

    const sanitized = { ...headers }

    // Mask sensitive headers
    const sensitiveHeaders = ["authorization", "x-callback-signature", "signature"]
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = this.maskString(sanitized[header])
      }
    }

    return sanitized
  }

  /**
   * Sanitasi payload untuk logging (menghapus informasi sensitif)
   */
  private sanitizePayload(payload: any): any {
    if (!payload) return {}

    // Jika payload adalah string, coba parse sebagai JSON
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload)
      } catch (e) {
        // Jika bukan JSON valid, kembalikan string asli
        return payload
      }
    }

    // Clone payload untuk menghindari mutasi
    const sanitized = JSON.parse(JSON.stringify(payload))

    // Mask sensitive fields
    const sensitiveFields = ["signature", "apiKey", "privateKey", "key", "token"]

    const maskObject = (obj: any) => {
      if (!obj || typeof obj !== "object") return

      Object.keys(obj).forEach((key) => {
        if (sensitiveFields.includes(key.toLowerCase())) {
          obj[key] = this.maskString(obj[key])
        } else if (typeof obj[key] === "object") {
          maskObject(obj[key])
        }
      })
    }

    maskObject(sanitized)
    return sanitized
  }

  /**
   * Mask string untuk keamanan
   */
  private maskString(str: string): string {
    if (!str) return ""
    if (str.length <= 8) return "****"

    return str.substring(0, 4) + "****" + str.substring(str.length - 4)
  }
}

/**
 * Buat instance logger untuk pembayaran
 */
export function createPaymentLogger(gateway: string): PaymentLogger {
  const requestId = `${gateway}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  return new PaymentLogger(requestId, gateway)
}

/**
 * Buat instance logger untuk notifikasi pembayaran
 */
export function createNotificationLogger(): PaymentLogger {
  const requestId = `payment-notify-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
  return new PaymentLogger(requestId)
}
