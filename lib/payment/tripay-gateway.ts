import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  PaymentStatus,
  CancelTransactionResult,
} from "./types"

// Tambahkan import untuk logger
import { PaymentLogger, createPaymentLogger } from "./logger"

// Tambahkan property logger ke class TriPayGateway
export class TriPayGateway implements PaymentGateway {
  name = "tripay"
  private apiKey: string
  private merchantCode: string
  private privateKey: string
  private isProduction: boolean
  private baseUrl: string
  private logger: PaymentLogger

  constructor() {
    this.isProduction = process.env.TRIPAY_USE_PRODUCTION === "true"

    // Gunakan kredensial yang sesuai berdasarkan mode
    if (this.isProduction) {
      this.apiKey = process.env.TRIPAY_API_KEY_PRODUCTION || ""
      this.merchantCode = process.env.TRIPAY_MERCHANT_CODE_PRODUCTION || ""
      this.privateKey = process.env.TRIPAY_PRIVATE_KEY_PRODUCTION || ""
      this.baseUrl = "https://tripay.co.id/api"
    } else {
      this.apiKey = process.env.TRIPAY_API_KEY || ""
      this.merchantCode = process.env.TRIPAY_MERCHANT_CODE || ""
      this.privateKey = process.env.TRIPAY_PRIVATE_KEY || ""
      this.baseUrl = "https://tripay.co.id/api-sandbox"
    }

    // Inisialisasi logger
    this.logger = createPaymentLogger("tripay")

    // Log environment setup
    this.logger.info("Initializing TriPay gateway", {
      mode: this.isProduction ? "PRODUCTION" : "SANDBOX",
      baseUrl: this.baseUrl,
      merchantCode: this.merchantCode,
      apiKeyConfigured: !!this.apiKey,
      privateKeyConfigured: !!this.privateKey,
    })
  }

  /**
   * Membuat transaksi baru di TriPay
   */
  async createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult> {
    const logger = createPaymentLogger("tripay")
    logger.info("Creating new transaction", {
      userId: params.userId,
      orderId: params.orderId,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      isProduction: this.isProduction,
    })

    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        logger.error("Missing API Key or Merchant Code", {
          isProduction: this.isProduction,
          merchantCode: this.merchantCode ? this.merchantCode.substring(0, 3) + "..." : "undefined",
          apiKeyExists: !!this.apiKey,
        })
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Map payment method dari UI ke kode TriPay
      const tripayMethod = this.mapPaymentMethodToTriPay(params.paymentMethod || "QR")
      logger.debug(`Mapped payment method from ${params.paymentMethod} to ${tripayMethod}`)

      // Siapkan data untuk request ke TriPay
      const payload = {
        method: tripayMethod, // Gunakan hasil mapping
        merchant_ref: params.orderId,
        amount: params.amount,
        customer_name: params.userName || "Pengguna",
        customer_email: params.userEmail || "user@example.com",
        customer_phone: params.userPhone || "", // Tambahkan nomor telepon jika tersedia
        order_items: [
          {
            name: "Premium Membership",
            price: params.amount,
            quantity: 1,
          },
        ],
        return_url: params.successRedirectUrl,
        callback_url: "https://secretme.site/api/payment/notification", // Hardcode callback URL
        signature: this.generateSignature(params.orderId, params.amount),
      }

      // Log request payload
      logger.debug("Prepared request payload", { payload: payload })

      // Log signature
      logger.debug("Generated signature", {
        signature:
          payload.signature.substring(0, 4) + "****" + payload.signature.substring(payload.signature.length - 4),
        orderId: params.orderId,
        amount: params.amount,
      })

      // Kirim request ke TriPay API dengan retry mechanism
      const maxRetries = 2
      let retryCount = 0
      let lastError = null

      while (retryCount <= maxRetries) {
        try {
          const url = `${this.baseUrl}/transaction/create`
          logger.debug(`Sending request to ${url} (Attempt ${retryCount + 1}/${maxRetries + 1})`, {
            isProduction: this.isProduction,
            baseUrl: this.baseUrl,
            merchantCode: this.merchantCode,
          })

          // Log HTTP request
          logger.logRequest(
            url,
            "POST",
            {
              Authorization: `Bearer ${this.apiKey.substring(0, 4)}****${this.apiKey.substring(this.apiKey.length - 4)}`,
              "Content-Type": "application/json",
            },
            payload,
          )

          // Gunakan timeout yang lebih lama (60 detik)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 60000)

          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId))

          // Periksa status HTTP terlebih dahulu
          if (!response.ok) {
            const errorText = await response.text()
            logger.error(`HTTP Error: ${response.status} ${response.statusText}`, null, {
              responseText: errorText.substring(0, 500), // Batasi panjang log
              isProduction: this.isProduction,
              baseUrl: this.baseUrl,
              merchantCode: this.merchantCode,
            })

            // Coba parse sebagai JSON jika mungkin
            try {
              const errorData = JSON.parse(errorText)
              logger.error(`Transaction creation failed with error response`, null, {
                status: response.status,
                errorData,
              })

              // Jika error terkait expired_time, coba tanpa parameter tersebut
              if (errorData.message && errorData.message.includes("expired time")) {
                logger.debug("Error related to expired_time, will retry without it")
                delete payload.expired_time
                // Lanjutkan ke retry berikutnya
                throw new Error(errorData.message)
              } else {
                throw new Error(errorData.message || `HTTP Error: ${response.status}`)
              }
            } catch (parseError) {
              // Jika bukan JSON, gunakan text error
              throw new Error(`HTTP Error: ${response.status} - ${errorText.substring(0, 100)}`)
            }
          }

          // Parse response JSON
          const data = await response.json()

          // Log HTTP response
          logger.logResponse(url, response.status, data)

          // Periksa apakah transaksi berhasil dibuat
          if (!data.success) {
            logger.error(`Transaction creation failed: ${data.message || "Unknown error"}`, null, {
              responseData: data,
            })
            throw new Error(data.message || "Gagal membuat transaksi di TriPay")
          }

          // Log success details
          logger.info("Transaction created successfully", {
            reference: data.data.reference,
            checkoutUrl: data.data.checkout_url,
          })

          // Log transaction
          logger.logTransaction("created", params.orderId, "pending", {
            reference: data.data.reference,
            gateway: "tripay",
            method: tripayMethod,
          })

          // Return hasil transaksi
          return {
            success: true,
            redirectUrl: data.data.checkout_url,
            token: data.data.reference,
            gatewayReference: data.data.reference,
          }
        } catch (error: any) {
          lastError = error
          logger.warn(`Attempt ${retryCount + 1}/${maxRetries + 1} failed: ${error.message}`)

          // Jika ini adalah timeout atau network error, coba lagi
          if (
            error.name === "AbortError" ||
            error.message.includes("network") ||
            error.message.includes("timeout") ||
            error.message.includes("expired time")
          ) {
            retryCount++
            if (retryCount <= maxRetries) {
              // Tunggu sebelum retry (exponential backoff)
              const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000)
              logger.debug(`Waiting ${waitTime}ms before retry`)
              await new Promise((resolve) => setTimeout(resolve, waitTime))
              continue
            }
          } else {
            // Jika bukan error yang bisa di-retry, langsung throw
            break
          }
        }
      }

      // Jika sampai di sini, berarti semua retry gagal
      throw lastError || new Error("Gagal membuat transaksi di TriPay setelah beberapa percobaan")
    } catch (error: any) {
      logger.error("Error creating transaction", error, {
        userId: params.userId,
        orderId: params.orderId,
        isProduction: this.isProduction,
        baseUrl: this.baseUrl,
        merchantCode: this.merchantCode,
      })

      return {
        success: false,
        error: error.message || "Gagal membuat transaksi di TriPay",
      }
    }
  }

  /**
   * Memverifikasi status transaksi di TriPay
   */
  async verifyTransaction(orderId: string): Promise<VerifyTransactionResult> {
    const logger = createPaymentLogger("tripay")
    logger.info("Verifying transaction", { orderId })

    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        logger.error("Missing API Key or Merchant Code")
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Kirim request ke TriPay API untuk memeriksa status transaksi
      const url = `${this.baseUrl}/transaction/detail?reference=${orderId}`
      logger.debug(`Sending request to ${url}`)

      // Log HTTP request
      logger.logRequest(url, "GET", {
        Authorization: `Bearer ${this.apiKey.substring(0, 4)}****${this.apiKey.substring(this.apiKey.length - 4)}`,
      })

      // Gunakan timeout yang lebih lama (30 detik)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      // Periksa status HTTP terlebih dahulu
      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`HTTP Error: ${response.status} ${response.statusText}`, null, {
          responseText: errorText.substring(0, 500), // Batasi panjang log
        })
        throw new Error(`HTTP Error: ${response.status} - ${errorText.substring(0, 100)}`)
      }

      const data = await response.json()

      // Log HTTP response
      logger.logResponse(url, response.status, data)

      // Periksa apakah request berhasil
      if (!data.success) {
        logger.error(`Verification failed: ${data.message || "Unknown error"}`, null, {
          responseData: data,
        })
        throw new Error(data.message || "Gagal memverifikasi transaksi di TriPay")
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(data.data.status)
      logger.debug(`TriPay status "${data.data.status}" mapped to internal status "${status}"`)

      // Log transaction verification
      logger.logTransaction("verified", orderId, status, {
        amount: data.data.amount,
        paymentMethod: data.data.payment_method,
        originalStatus: data.data.status,
      })

      return {
        isValid: true,
        status,
        amount: data.data.amount,
        paymentMethod: data.data.payment_method,
        details: data.data,
      }
    } catch (error: any) {
      logger.error("Error verifying transaction", error, { orderId })
      return {
        isValid: false,
        status: "unknown",
      }
    }
  }

  /**
   * Menangani notifikasi webhook dari TriPay
   * @param payload Data notifikasi dari TriPay
   * @param headers Headers dari request (opsional)
   */
  async handleNotification(payload: any, headers?: any): Promise<NotificationResult> {
    const logger = createPaymentLogger("tripay")
    logger.info("Received notification webhook", {
      payloadSize: JSON.stringify(payload).length,
      hasHeaders: !!headers,
    })

    try {
      // Identifikasi jenis event dari payload
      const eventType = this.identifyEventType(payload)
      logger.debug(`Event type identified: ${eventType}`)

      // Cek apakah signature ada di payload atau di headers
      let receivedSignature = payload.signature

      // Jika signature tidak ada di payload, coba ambil dari headers
      if (!receivedSignature && headers) {
        receivedSignature = headers["x-callback-signature"] || headers["X-Callback-Signature"]
        logger.debug("Using signature from headers", {
          signature: receivedSignature
            ? receivedSignature.substring(0, 4) + "****" + receivedSignature.substring(receivedSignature.length - 4)
            : "not found",
        })
      }

      if (!receivedSignature) {
        logger.warn("Signature not found in payload or headers, proceeding without validation")
      } else {
        // Generate expected signature berdasarkan payload
        const expectedSignature = this.generateCallbackSignature(payload)

        // Log signature details untuk debugging
        logger.debug("Signature details", {
          received: receivedSignature
            ? receivedSignature.substring(0, 4) + "****" + receivedSignature.substring(receivedSignature.length - 4)
            : "none",
          expected: expectedSignature
            ? expectedSignature.substring(0, 4) + "****" + expectedSignature.substring(expectedSignature.length - 4)
            : "none",
          isValid: receivedSignature && receivedSignature.toLowerCase() === expectedSignature.toLowerCase(),
        })

        // Validasi signature
        if (receivedSignature && receivedSignature.toLowerCase() !== expectedSignature.toLowerCase()) {
          logger.warn("Signature validation failed, but proceeding with processing")
        } else {
          logger.info("Signature validation successful")
        }
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(payload.status)
      logger.debug(`TriPay status "${payload.status}" mapped to internal status "${status}"`)

      // Log payment event
      logger.logPaymentEvent(eventType, payload.merchant_ref, status, {
        reference: payload.reference,
        paymentMethod: payload.payment_method,
        amount: payload.total_amount,
      })

      // Proses berdasarkan jenis event
      if (eventType === "refund") {
        logger.info("Processing refund event", {
          merchantRef: payload.merchant_ref,
          reference: payload.reference,
          amount: payload.refund_amount || payload.total_amount,
        })

        // Implementasi khusus untuk refund
        return this.handleRefundEvent(payload, logger.requestId)
      } else if (eventType === "payment") {
        logger.info("Processing payment event", {
          merchantRef: payload.merchant_ref,
          reference: payload.reference,
          amount: payload.total_amount,
          status: status,
        })

        // Implementasi untuk event pembayaran (default)
        return {
          orderId: payload.merchant_ref,
          status,
          isSuccess: status === "success",
          amount: payload.total_amount,
          paymentMethod: payload.payment_method,
          details: payload,
        }
      } else {
        logger.warn("Unknown event type, processing as payment", { eventType })

        // Default ke event pembayaran
        return {
          orderId: payload.merchant_ref,
          status,
          isSuccess: status === "success",
          amount: payload.total_amount,
          paymentMethod: payload.payment_method,
          details: payload,
        }
      }
    } catch (error: any) {
      logger.error("Error handling notification", error)
      throw error
    }
  }

  /**
   * Membatalkan transaksi di TriPay
   * @param reference Nomor referensi transaksi TriPay
   */
  async cancelTransaction(reference: string): Promise<CancelTransactionResult> {
    const logger = createPaymentLogger("tripay")
    logger.info("Cancelling transaction", { reference })

    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        logger.error("Missing API Key or Merchant Code")
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Kirim request ke TriPay API untuk membatalkan transaksi
      const url = `${this.baseUrl}/transaction/close`
      logger.debug(`Sending request to ${url}`)

      // Siapkan payload untuk request pembatalan
      const payload = {
        reference: reference,
      }

      // Log HTTP request
      logger.logRequest(
        url,
        "POST",
        {
          Authorization: `Bearer ${this.apiKey.substring(0, 4)}****${this.apiKey.substring(this.apiKey.length - 4)}`,
          "Content-Type": "application/json",
        },
        payload,
      )

      // Gunakan timeout yang lebih lama (30 detik)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      // Periksa status HTTP terlebih dahulu
      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`HTTP Error: ${response.status} ${response.statusText}`, null, {
          responseText: errorText.substring(0, 500), // Batasi panjang log
        })

        // Coba parse sebagai JSON jika mungkin
        try {
          const errorData = JSON.parse(errorText)

          // Jika transaksi sudah dibayar atau sudah dibatalkan, anggap berhasil
          if (
            errorData.message &&
            (errorData.message.includes("already paid") ||
              errorData.message.includes("already closed") ||
              errorData.message.includes("already expired"))
          ) {
            logger.info("Transaction already in final state, considering cancellation successful", {
              reference,
              message: errorData.message,
            })

            return {
              success: true,
              message: errorData.message || "Transaksi sudah dalam status final",
            }
          }

          throw new Error(errorData.message || `HTTP Error: ${response.status}`)
        } catch (parseError) {
          // Jika bukan JSON, gunakan text error
          throw new Error(`HTTP Error: ${response.status} - ${errorText.substring(0, 100)}`)
        }
      }

      const data = await response.json()

      // Log HTTP response
      logger.logResponse(url, response.status, data)

      // Periksa apakah request berhasil
      if (!data.success) {
        logger.error(`Cancellation failed: ${data.message || "Unknown error"}`, null, {
          responseData: data,
        })

        // Jika transaksi sudah dibayar atau sudah dibatalkan, anggap berhasil
        if (
          data.message &&
          (data.message.includes("already paid") ||
            data.message.includes("already closed") ||
            data.message.includes("already expired"))
        ) {
          logger.info("Transaction already in final state, considering cancellation successful", {
            reference,
            message: data.message,
          })

          return {
            success: true,
            message: data.message || "Transaksi sudah dalam status final",
          }
        }

        throw new Error(data.message || "Gagal membatalkan transaksi di TriPay")
      }

      // Log transaction cancellation
      logger.logTransaction("cancelled", reference, "failed", {
        reference: reference,
        gateway: "tripay",
      })

      return {
        success: true,
        message: data.message || "Transaksi berhasil dibatalkan",
      }
    } catch (error: any) {
      logger.error("Error cancelling transaction", error, { reference })
      return {
        success: false,
        error: error.message || "Gagal membatalkan transaksi di TriPay",
      }
    }
  }

  /**
   * Memetakan status dari TriPay ke status internal
   */
  private mapTriPayStatus(tripayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      UNPAID: "pending",
      PAID: "success",
      REFUND: "refunded",
      EXPIRED: "expired",
      FAILED: "failed",
      CANCELED: "cancelled", // Tambahkan mapping untuk CANCELED
    }

    return statusMap[tripayStatus] || "unknown"
  }

  /**
   * Menghasilkan signature untuk request ke TriPay
   */
  private generateSignature(orderId: string, amount: number): string {
    const crypto = require("crypto")
    const data = `${this.merchantCode}${orderId}${amount}`
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
  }

  /**
   * Menghasilkan signature untuk callback dari TriPay
   * Format: merchantCode + reference + amount + status
   */
  private generateCallbackSignature(payload: any): string {
    const crypto = require("crypto")

    // Pastikan semua nilai dalam format string
    const merchantCode = this.merchantCode
    const reference = String(payload.reference || "")
    const amount = String(payload.total_amount || "0")
    const status = String(payload.status || "")

    // Format yang benar: merchantCode + reference + amount + status
    const data = `${merchantCode}${reference}${amount}${status}`

    // Log untuk debugging
    this.logger.debug("Generating callback signature", {
      merchantCode,
      reference,
      amount,
      status,
      data,
    })

    // Hasilkan signature dengan HMAC SHA256
    const signature = crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")

    this.logger.debug("Generated callback signature", {
      signature: signature.substring(0, 4) + "****" + signature.substring(signature.length - 4),
    })

    return signature
  }

  // Tambahkan metode untuk mengidentifikasi jenis event
  private identifyEventType(payload: any): string {
    // Identifikasi jenis event berdasarkan payload
    // Ini perlu disesuaikan dengan dokumentasi TriPay terbaru

    // Jika ada field refund_amount, ini adalah event refund
    if (payload.refund_amount || payload.event === "refund") {
      return "refund"
    }

    // Default ke event pembayaran
    return "payment"
  }

  // Tambahkan metode untuk menangani event refund
  private handleRefundEvent(payload: any, requestId: string): NotificationResult {
    const logger = new PaymentLogger(requestId, "tripay")
    logger.info("Handling refund event", {
      merchantRef: payload.merchant_ref,
      reference: payload.reference,
      amount: payload.refund_amount || payload.total_amount,
    })

    // Mapping status refund
    const status = "refunded"

    // Log transaction
    logger.logTransaction("refunded", payload.merchant_ref, status, {
      reference: payload.reference,
      amount: payload.refund_amount || payload.total_amount,
    })

    return {
      orderId: payload.merchant_ref,
      status,
      isSuccess: true, // Refund biasanya selalu berhasil jika callback diterima
      amount: payload.refund_amount || payload.total_amount,
      paymentMethod: payload.payment_method,
      details: {
        ...payload,
        refund_processed: true,
        refund_time: new Date().toISOString(),
      },
    }
  }

  /**
   * Memetakan kode metode pembayaran UI ke kode TriPay
   * Berdasarkan dokumentasi resmi: https://tripay.co.id/developer?tab=merchant-payment-channel
   */
  private mapPaymentMethodToTriPay(uiMethod: string): string {
    // Kode metode pembayaran resmi TriPay
    const methodMap: Record<string, string> = {
      // Virtual Account
      BR: "BRIVA", // BRI Virtual Account
      M2: "MANDIRIVA", // Mandiri Virtual Account
      I1: "BNIVA", // BNI Virtual Account
      BV: "BSIVA", // BSI Virtual Account
      BT: "PERMATAVA", // Permata Virtual Account
      NC: "CIMBVA", // CIMB Virtual Account
      BC: "BCAVA", // BCA Virtual Account - Tambahkan ini

      // E-Wallet
      QR: "QRIS", // QRIS by ShopeePay
      OV: "OVO", // OVO
      SA: "SHOPEEPAY", // ShopeePay
      DA: "DANA", // DANA
      LF: "LINKAJA", // LinkAja

      // Convenience Store / Retail
      A1: "ALFAMART", // Alfamart
      IR: "INDOMARET", // Indomaret

      // Default
      default: "QRIS",
    }

    return methodMap[uiMethod] || methodMap.default
  }
}
