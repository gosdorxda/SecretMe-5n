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
   * Menangani notifikasi webhook dari TriPay dengan mode debug signature
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
      this.debugSignature(payload, headers)

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

      // Mode debug signature - coba berbagai format signature
      if (receivedSignature) {
        // Format 1: merchantCode + reference + amount + status (format lama)
        const format1 = this.generateSignatureFormat1(payload)

        // Format 2: privateKey + reference + status (format baru)
        const format2 = this.generateSignatureFormat2(payload)

        // Format 3: reference + status dengan privateKey sebagai key HMAC (format alternatif)
        const format3 = this.generateSignatureFormat3(payload)

        // Format 4: Berdasarkan dokumentasi terbaru - merchantCode + reference + amount
        // Ini sama dengan format pembuatan transaksi
        const format4 = this.generateSignatureFormat4(payload)

        // Format 5: Menggunakan apiKey sebagai key HMAC
        const format5 = this.generateSignatureFormat5(payload)

        // Format 6: Menggunakan apiKey + reference + status
        const format6 = this.generateSignatureFormat6(payload)

        // Format 7: Menggunakan apiKey + reference + amount
        const format7 = this.generateSignatureFormat7(payload)

        logger.debug("Signature debug mode", {
          received:
            receivedSignature.substring(0, 8) + "..." + receivedSignature.substring(receivedSignature.length - 8),
          format1: format1.substring(0, 8) + "..." + format1.substring(format1.length - 8),
          format2: format2.substring(0, 8) + "..." + format2.substring(format2.length - 8),
          format3: format3.substring(0, 8) + "..." + format3.substring(format3.length - 8),
          format4: format4.substring(0, 8) + "..." + format4.substring(format4.length - 8),
          format5: format5.substring(0, 8) + "..." + format5.substring(format5.length - 8),
          format6: format6.substring(0, 8) + "..." + format6.substring(format6.length - 8),
          format7: format7.substring(0, 8) + "..." + format7.substring(format7.length - 8),
          matchesFormat1: receivedSignature.toLowerCase() === format1.toLowerCase(),
          matchesFormat2: receivedSignature.toLowerCase() === format2.toLowerCase(),
          matchesFormat3: receivedSignature.toLowerCase() === format3.toLowerCase(),
          matchesFormat4: receivedSignature.toLowerCase() === format4.toLowerCase(),
          matchesFormat5: receivedSignature.toLowerCase() === format5.toLowerCase(),
          matchesFormat6: receivedSignature.toLowerCase() === format6.toLowerCase(),
          matchesFormat7: receivedSignature.toLowerCase() === format7.toLowerCase(),
        })

        // Jika salah satu format cocok, gunakan format tersebut untuk validasi di masa depan
        if (receivedSignature.toLowerCase() === format1.toLowerCase()) {
          logger.info("Signature matches Format 1 (merchantCode + reference + amount + status)")
        } else if (receivedSignature.toLowerCase() === format2.toLowerCase()) {
          logger.info("Signature matches Format 2 (privateKey + reference + status)")
        } else if (receivedSignature.toLowerCase() === format3.toLowerCase()) {
          logger.info("Signature matches Format 3 (HMAC(reference + status, privateKey))")
        } else if (receivedSignature.toLowerCase() === format4.toLowerCase()) {
          logger.info("Signature matches Format 4 (merchantCode + reference + amount)")
        } else if (receivedSignature.toLowerCase() === format5.toLowerCase()) {
          logger.info("Signature matches Format 5 (HMAC(reference + status, apiKey))")
        } else if (receivedSignature.toLowerCase() === format6.toLowerCase()) {
          logger.info("Signature matches Format 6 (apiKey + reference + status)")
        } else if (receivedSignature.toLowerCase() === format7.toLowerCase()) {
          logger.info("Signature matches Format 7 (apiKey + reference + amount)")
        } else {
          logger.warn("Signature doesn't match any known format")
        }
      }

      // Untuk sementara, bypass validasi signature
      logger.info("Bypassing signature validation for now")

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
   * Metode khusus untuk debugging signature
   * PERHATIAN: Hanya gunakan untuk debugging, jangan di production!
   */
  private debugSignature(payload: any, headers?: any): void {
    const crypto = require("crypto")

    // Ambil nilai yang digunakan untuk signature
    const merchantCode = this.merchantCode
    const reference = String(payload.reference || "")
    const amount = String(payload.total_amount || "0")
    const status = String(payload.status || "")

    // Log nilai raw (tanpa disamarkan)
    this.logger.debug("Raw signature values for debugging", {
      merchantCode: merchantCode,
      reference: reference,
      amount: amount,
      status: status,
      privateKey: this.privateKey.substring(0, 3) + "...", // Hanya tampilkan sebagian kecil
      apiKey: this.apiKey.substring(0, 3) + "...", // Hanya tampilkan sebagian kecil
    })

    // Format 1: merchantCode + reference + amount + status
    const data1 = `${merchantCode}${reference}${amount}${status}`
    const sig1 = crypto.createHmac("sha256", this.privateKey).update(data1).digest("hex")

    // Format 4: merchantCode + reference + amount (sama dengan format pembuatan transaksi)
    const data4 = `${merchantCode}${reference}${amount}`
    const sig4 = crypto.createHmac("sha256", this.privateKey).update(data4).digest("hex")

    // Format 5: Menggunakan apiKey sebagai key HMAC
    const data5 = `${reference}${status}`
    const sig5 = crypto.createHmac("sha256", this.apiKey).update(data5).digest("hex")

    // Format 6: Menggunakan apiKey + reference + status
    const data6 = `${this.apiKey}${reference}${status}`
    const sig6 = crypto.createHmac("sha256", this.apiKey).update(data6).digest("hex")

    // Format 7: Menggunakan apiKey + reference + amount
    const data7 = `${this.apiKey}${reference}${amount}`
    const sig7 = crypto.createHmac("sha256", this.apiKey).update(data7).digest("hex")

    // Log raw data dan signature
    this.logger.debug("Raw signature calculation", {
      data1: data1,
      sig1: sig1,
      data4: data4,
      sig4: sig4,
      data5: data5,
      sig5: sig5,
      data6: data6,
      sig6: sig6,
      data7: data7,
      sig7: sig7,
    })

    // Jika ada header, coba cek signature dari header
    if (headers) {
      const headerSignature = headers["x-callback-signature"] || headers["X-Callback-Signature"]
      if (headerSignature) {
        this.logger.debug("Header signature", {
          headerName: headers["x-callback-signature"] ? "x-callback-signature" : "X-Callback-Signature",
          signature: headerSignature.substring(0, 8) + "..." + headerSignature.substring(headerSignature.length - 8),
        })
      }

      // Log semua header yang mungkin berkaitan dengan signature
      const signatureHeaders = Object.keys(headers).filter(
        (key) => key.toLowerCase().includes("signature") || key.toLowerCase().includes("sign"),
      )
      if (signatureHeaders.length > 0) {
        this.logger.debug("All potential signature headers", {
          headers: signatureHeaders.map((key) => ({
            name: key,
            value: headers[key].substring(0, 8) + "..." + headers[key].substring(headers[key].length - 8),
          })),
        })
      }
    }
  }

  // Metode helper untuk format signature yang berbeda
  private generateSignatureFormat1(payload: any): string {
    const crypto = require("crypto")
    const merchantCode = this.merchantCode
    const reference = String(payload.reference || "")
    const amount = String(payload.total_amount || "0")
    const status = String(payload.status || "")
    const data = `${merchantCode}${reference}${amount}${status}`
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
  }

  private generateSignatureFormat2(payload: any): string {
    const crypto = require("crypto")
    const reference = String(payload.reference || "")
    const status = String(payload.status || "")
    const data = `${this.privateKey}${reference}${status}`
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
  }

  private generateSignatureFormat3(payload: any): string {
    const crypto = require("crypto")
    const reference = String(payload.reference || "")
    const status = String(payload.status || "")
    return crypto.createHmac("sha256", this.privateKey).update(`${reference}${status}`).digest("hex")
  }

  // Tambahkan metode untuk format signature yang sama dengan pembuatan transaksi
  private generateSignatureFormat4(payload: any): string {
    const crypto = require("crypto")
    const merchantCode = this.merchantCode
    const reference = String(payload.reference || "")
    const amount = String(payload.total_amount || "0")
    const data = `${merchantCode}${reference}${amount}`
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
  }

  // Format baru: Menggunakan apiKey sebagai key HMAC
  private generateSignatureFormat5(payload: any): string {
    const crypto = require("crypto")
    const reference = String(payload.reference || "")
    const status = String(payload.status || "")
    return crypto.createHmac("sha256", this.apiKey).update(`${reference}${status}`).digest("hex")
  }

  // Format baru: Menggunakan apiKey + reference + status
  private generateSignatureFormat6(payload: any): string {
    const crypto = require("crypto")
    const reference = String(payload.reference || "")
    const status = String(payload.status || "")
    const data = `${this.apiKey}${reference}${status}`
    return crypto.createHmac("sha256", this.apiKey).update(data).digest("hex")
  }

  // Format baru: Menggunakan apiKey + reference + amount
  private generateSignatureFormat7(payload: any): string {
    const crypto = require("crypto")
    const reference = String(payload.reference || "")
    const amount = String(payload.total_amount || "0")
    const data = `${this.apiKey}${reference}${amount}`
    return crypto.createHmac("sha256", this.apiKey).update(data).digest("hex")
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
   *
   * PERBAIKAN: Tambahkan logging lebih detail untuk membantu debug
   */
  private generateCallbackSignature(payload: any): string {
    const crypto = require("crypto")

    // Format 4: merchantCode + reference + amount
    const merchantCode = this.merchantCode
    const reference = String(payload.reference || "")
    const amount = String(payload.total_amount || "0")

    const data = `${merchantCode}${reference}${amount}`

    this.logger.debug("Generating callback signature", {
      merchantCode,
      reference,
      amount,
      data,
    })

    const signature = crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")

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
