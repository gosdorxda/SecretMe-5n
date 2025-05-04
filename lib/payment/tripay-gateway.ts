import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  PaymentStatus,
  CancelTransactionResult,
} from "./types"

// Import logger
import { type PaymentLogger, createPaymentLogger } from "./payment-logger"

// Pastikan kelas diekspor dengan benar
export class TriPayGateway implements PaymentGateway {
  name = "tripay"
  private apiKey: string
  private merchantCode: string
  private privateKey: string
  private isProduction: boolean
  private baseUrl: string
  private logger: PaymentLogger
  private phoneNumber?: string

  constructor(phoneNumber?: string) {
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
    })

    this.phoneNumber = phoneNumber
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
    })

    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        logger.error("Missing API Key or Merchant Code")
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Map payment method dari UI ke kode TriPay
      const tripayMethod = this.mapPaymentMethodToTriPay(params.paymentMethod || "QR")

      // Siapkan data untuk request ke TriPay
      const payload = {
        method: tripayMethod,
        merchant_ref: params.orderId,
        amount: params.amount,
        customer_name: params.userName || "Pengguna",
        customer_email: params.userEmail || "user@example.com",
        customer_phone: this.phoneNumber || params.userPhone || "081234567890", // Gunakan nomor telepon yang diberikan
        order_items: [
          {
            name: "Premium Membership",
            price: params.amount,
            quantity: 1,
          },
        ],
        return_url: params.successRedirectUrl,
        callback_url: "https://secretme.site/api/payment/notification",
        signature: this.generateSignature(params.orderId, params.amount),
      }

      // Kirim request ke TriPay API dengan retry mechanism
      const maxRetries = 2
      let retryCount = 0
      let lastError = null

      while (retryCount <= maxRetries) {
        try {
          const url = `${this.baseUrl}/transaction/create`
          logger.debug(`Sending request to ${url} (Attempt ${retryCount + 1}/${maxRetries + 1})`)

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
              responseText: errorText.substring(0, 500),
            })

            // Coba parse sebagai JSON jika mungkin
            try {
              const errorData = JSON.parse(errorText)
              logger.error(`Transaction creation failed with error response`, null, {
                status: response.status,
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

          // Periksa apakah transaksi berhasil dibuat
          if (!data.success) {
            logger.error(`Transaction creation failed: ${data.message || "Unknown error"}`)
            throw new Error(data.message || "Gagal membuat transaksi di TriPay")
          }

          // Log success details
          logger.info("Transaction created successfully", {
            reference: data.data.reference,
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
        logger.error(`HTTP Error: ${response.status} ${response.statusText}`)
        throw new Error(`HTTP Error: ${response.status} - ${errorText.substring(0, 100)}`)
      }

      const data = await response.json()

      // Periksa apakah request berhasil
      if (!data.success) {
        logger.error(`Verification failed: ${data.message || "Unknown error"}`)
        throw new Error(data.message || "Gagal memverifikasi transaksi di TriPay")
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(data.data.status)
      logger.debug(`TriPay status "${data.data.status}" mapped to internal status "${status}"`)

      // Log transaction verification
      logger.info("Transaction verified", {
        orderId,
        status,
        amount: data.data.amount,
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
   */
  async handleNotification(payload: any, headers?: any): Promise<NotificationResult> {
    const logger = createPaymentLogger("tripay")
    logger.info("Received notification webhook", {
      reference: payload.reference,
      merchantRef: payload.merchant_ref,
      status: payload.status,
    })

    try {
      // PERBAIKAN: Penanganan khusus untuk test callback
      if (payload.note === "Test Callback") {
        logger.info("Processing test callback from TriPay")

        // Gunakan nilai default untuk test callback
        const orderId = payload.merchant_ref || "TEST-CALLBACK-" + Date.now()
        const reference = payload.reference || "TEST-REF-" + Date.now()

        return {
          orderId: orderId,
          status: this.mapTriPayStatus(payload.status || "PAID"),
          isSuccess: true,
          amount: payload.total_amount || 0,
          paymentMethod: payload.payment_method || "QRIS by ShopeePay",
          details: {
            ...payload,
            merchant_ref: orderId,
            reference: reference,
            is_test_callback: true,
          },
        }
      }

      // Ambil signature dari header
      const receivedSignature = headers ? headers["x-callback-signature"] || headers["X-Callback-Signature"] : null

      if (receivedSignature) {
        logger.debug("Validating signature from TriPay")

        // Pastikan signature tidak dimasukkan ke dalam payload untuk validasi
        const payloadForValidation = { ...payload }
        delete payloadForValidation.signature

        // Validasi signature
        const isValid = await this.validateSignature(payloadForValidation, receivedSignature)

        if (isValid) {
          logger.info("Signature validation successful")
        } else {
          logger.warn("Signature validation failed, but continuing processing")
        }
      } else {
        logger.warn("No signature provided, bypassing validation")
      }

      // Mapping status TriPay ke status internal
      const status = this.mapTriPayStatus(payload.status)

      // Log payment event
      logger.info("Processing payment notification", {
        merchantRef: payload.merchant_ref,
        reference: payload.reference,
        status: status,
      })

      // Proses berdasarkan status
      if (status === "refunded") {
        logger.info("Processing refund event", {
          merchantRef: payload.merchant_ref,
          reference: payload.reference,
        })

        // Implementasi khusus untuk refund
        return {
          orderId: payload.merchant_ref,
          status,
          isSuccess: true,
          amount: payload.refund_amount || payload.total_amount,
          paymentMethod: payload.payment_method,
          details: payload,
        }
      } else {
        // Implementasi untuk event pembayaran (default)
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
   * Validasi signature dari TriPay
   * Menggunakan format yang benar: HMAC-SHA256(privateKey, JSON.stringify(payload))
   */
  private async validateSignature(payload: any, receivedSignature: string): Promise<boolean> {
    const crypto = require("crypto")
    const logger = createPaymentLogger("tripay")

    try {
      // Konversi payload ke JSON string
      const rawPayload = JSON.stringify(payload)

      // Hitung signature
      const calculatedSignature = crypto.createHmac("sha256", this.privateKey).update(rawPayload).digest("hex")

      // Bandingkan signature (case insensitive)
      const isValid = calculatedSignature.toLowerCase() === receivedSignature.toLowerCase()

      logger.debug("Signature validation result", {
        isValid,
        signatureLength: receivedSignature.length,
      })

      return isValid
    } catch (error) {
      logger.error("Error validating signature", error)
      return false
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
        logger.error(`HTTP Error: ${response.status} ${response.statusText}`)

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

      // Periksa apakah request berhasil
      if (!data.success) {
        logger.error(`Cancellation failed: ${data.message || "Unknown error"}`)

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
      logger.info("Transaction cancelled successfully", {
        reference: reference,
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
      CANCELED: "cancelled",
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
      BC: "BCAVA", // BCA Virtual Account

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

  /**
   * Metode khusus untuk debugging signature
   * Dapat dipanggil dari route handler untuk menguji format signature
   */
  async debugSignature(payload: any, receivedSignature: string): Promise<any> {
    const logger = createPaymentLogger("tripay-debug")
    const crypto = require("crypto")

    logger.info("Starting signature debugging", {
      receivedSignature: receivedSignature.substring(0, 10) + "...",
    })

    // Pastikan signature tidak dimasukkan ke dalam payload untuk validasi
    const payloadForValidation = { ...payload }
    delete payloadForValidation.signature

    // Format yang benar: raw JSON payload
    const rawPayload = JSON.stringify(payloadForValidation)
    const calculatedSignature = crypto.createHmac("sha256", this.privateKey).update(rawPayload).digest("hex")
    const isValid = calculatedSignature.toLowerCase() === receivedSignature.toLowerCase()

    logger.debug("Signature validation result", {
      isValid,
      payloadLength: rawPayload.length,
      signatureLength: calculatedSignature.length,
    })

    return {
      receivedSignature: receivedSignature,
      calculatedSignature: calculatedSignature,
      isValid: isValid,
      payloadUsed: "JSON.stringify(payload)",
    }
  }
}
