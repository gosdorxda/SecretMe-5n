import type {
  PaymentGateway,
  CreateTransactionParams,
  CreateTransactionResult,
  VerifyTransactionResult,
  NotificationResult,
  PaymentStatus,
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
    this.apiKey = process.env.TRIPAY_API_KEY || ""
    this.merchantCode = process.env.TRIPAY_MERCHANT_CODE || ""
    this.privateKey = process.env.TRIPAY_PRIVATE_KEY || ""

    // Gunakan environment variable khusus untuk menentukan mode
    this.isProduction = process.env.TRIPAY_USE_PRODUCTION === "true"

    // Tentukan baseUrl berdasarkan mode
    this.baseUrl = this.isProduction ? "https://tripay.co.id/api" : "https://tripay.co.id/api-sandbox"

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
    })

    try {
      // Validasi parameter yang diperlukan
      if (!this.apiKey || !this.merchantCode) {
        logger.error("Missing API Key or Merchant Code")
        throw new Error("TriPay API Key dan Merchant Code diperlukan")
      }

      // Map payment method dari UI ke kode TriPay
      const tripayMethod = this.mapPaymentMethodToTriPay(params.paymentMethod || "QR")
      logger.debug(`Mapped payment method from ${params.paymentMethod} to ${tripayMethod}`)

      // Hitung waktu kedaluwarsa (1 jam dari sekarang dalam format Unix timestamp)
      const now = Math.floor(Date.now() / 1000) // Waktu sekarang dalam detik
      const expiredTime = now + 3600 // 1 jam dari sekarang dalam detik (3600 detik = 1 jam)

      logger.debug("Transaction expiry configuration", {
        currentTime: now,
        expiryTime: expiredTime,
        durationSeconds: 3600,
      })

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
        expired_time: 3600, // 1 jam dalam detik
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

      // Kirim request ke TriPay API
      const url = `${this.baseUrl}/transaction/create`
      logger.debug(`Sending request to ${url}`)

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

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      // Log HTTP response
      logger.logResponse(url, response.status, data)

      // Periksa apakah transaksi berhasil dibuat
      if (!response.ok || data.success !== true) {
        logger.error(`Transaction creation failed: ${data.message || "Unknown error"}`, null, {
          status: response.status,
          responseData: data,
        })

        // Coba alternatif jika masih error dengan expired_time
        if (data.message && data.message.includes("expired time")) {
          logger.debug("Trying alternative approach for expired_time")

          // Coba dengan format yang berbeda atau tanpa expired_time
          delete payload.expired_time

          logger.debug("Prepared alternative request payload", { payload: payload })

          // Log HTTP request (alternative)
          logger.logRequest(
            url,
            "POST",
            {
              Authorization: `Bearer ${this.apiKey.substring(0, 4)}****${this.apiKey.substring(this.apiKey.length - 4)}`,
              "Content-Type": "application/json",
            },
            payload,
          )

          const altResponse = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          const altData = await altResponse.json()

          // Log HTTP response (alternative)
          logger.logResponse(url, altResponse.status, altData)

          if (altResponse.ok && altData.success === true) {
            // Log success details
            logger.info("Transaction created successfully with alternative approach", {
              reference: altData.data.reference,
              checkoutUrl: altData.data.checkout_url,
            })

            // Log transaction
            logger.logTransaction("created", params.orderId, "pending", {
              reference: altData.data.reference,
              gateway: "tripay",
              method: tripayMethod,
            })

            return {
              success: true,
              redirectUrl: altData.data.checkout_url,
              token: altData.data.reference,
              gatewayReference: altData.data.reference,
            }
          }
        }

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

      // Log HTTP request
      logger.logRequest(url, "GET", {
        Authorization: `Bearer ${this.apiKey.substring(0, 4)}****${this.apiKey.substring(this.apiKey.length - 4)}`,
      })

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      const data = await response.json()

      // Log HTTP response
      logger.logResponse(url, response.status, data)

      // Periksa apakah request berhasil
      if (!response.ok || data.success !== true) {
        logger.error(`Verification failed: ${data.message || "Unknown error"}`, null, {
          status: response.status,
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
      let signature = payload.signature

      // Jika signature tidak ada di payload, coba ambil dari headers
      if (!signature && headers) {
        signature = headers["x-callback-signature"] || headers["X-Callback-Signature"]
        logger.debug("Using signature from headers", {
          signature: signature
            ? signature.substring(0, 4) + "****" + signature.substring(signature.length - 4)
            : "not found",
        })
      }

      if (!signature) {
        logger.error("Signature not found in payload or headers")
        throw new Error("Signature not found in TriPay notification")
      }

      // Generate expected signature berdasarkan payload
      const expectedSignature = this.generateCallbackSignature(payload)

      // Log signature validation
      logger.logSignatureValidation(
        signature,
        expectedSignature,
        signature.toLowerCase() === expectedSignature.toLowerCase(),
      )

      // Validasi signature dengan toleransi untuk perbedaan format
      // Beberapa implementasi mungkin menggunakan uppercase/lowercase
      if (signature.toLowerCase() !== expectedSignature.toLowerCase()) {
        logger.warn("Invalid signature, trying alternative method")

        // Coba metode alternatif untuk validasi signature
        const altSignature = this.generateAlternativeSignature(payload)

        // Log alternative signature validation
        logger.logSignatureValidation(signature, altSignature, signature.toLowerCase() === altSignature.toLowerCase())

        if (signature.toLowerCase() !== altSignature.toLowerCase()) {
          logger.error("All signature validation methods failed")
          throw new Error("Invalid signature from TriPay")
        } else {
          logger.info("Signature valid using alternative method")
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
   * Memetakan status dari TriPay ke status internal
   */
  private mapTriPayStatus(tripayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      UNPAID: "pending",
      PAID: "success",
      REFUND: "refunded",
      EXPIRED: "expired",
      FAILED: "failed",
      CANCELED: "failed",
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
   */
  private generateCallbackSignature(payload: any): string {
    const crypto = require("crypto")

    // Berdasarkan dokumentasi TriPay terbaru, signature callback dihitung dari:
    // merchantCode + reference + amount + status
    // Pastikan semua nilai dikonversi ke string
    const merchantCode = this.merchantCode
    const reference = payload.reference || ""
    const merchantRef = payload.merchant_ref || ""
    const amount = String(payload.total_amount || "0")
    const status = payload.status || ""

    // Log untuk debugging
    console.log(
      `Generating signature with: merchantCode=${merchantCode}, reference=${reference}, amount=${amount}, status=${status}`,
    )

    // Buat data untuk signature
    let data = ""

    // Gunakan reference jika tersedia, jika tidak gunakan merchant_ref
    if (reference) {
      data = `${merchantCode}${reference}${amount}${status}`
    } else {
      data = `${merchantCode}${merchantRef}${amount}${status}`
    }

    console.log(`Signature data string: ${data}`)

    // Hasilkan signature dengan HMAC SHA256
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
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

  // Tambahkan metode alternatif untuk validasi signature
  private generateAlternativeSignature(payload: any): string {
    const crypto = require("crypto")

    // Beberapa implementasi TriPay mungkin menggunakan format yang berbeda
    // Coba beberapa kemungkinan format

    // Format 1: merchantCode + merchantRef + status
    const format1 = `${this.merchantCode}${payload.merchant_ref}${payload.status}`

    // Format 2: merchantCode + reference + status
    const format2 = `${this.merchantCode}${payload.reference}${payload.status}`

    // Format 3: merchantCode + merchantRef
    const format3 = `${this.merchantCode}${payload.merchant_ref}`

    console.log(`Alternative signature format 1: ${format1}`)

    // Gunakan format 1 sebagai default
    return crypto.createHmac("sha256", this.privateKey).update(format1).digest("hex")
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
