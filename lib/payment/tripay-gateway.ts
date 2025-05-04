import type { PaymentGateway, CreateTransactionParams, CreateTransactionResult } from "./types"

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
        return_url: params.successRedirectUrl || "https://secretme.site/premium?status=success", // Pastikan URL redirect default ke premium
        callback_url: "https://secretme.site/api/payment/notification",
        signature: this.generateSignature(params.orderId, params.amount),
      }

      // Log URL redirect yang digunakan
      logger.info("Using return URL for payment", { returnUrl: payload.return_url })

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
            checkoutUrl: data.data.checkout_url,
            paymentMethod: tripayMethod,
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

  // Metode lainnya tidak berubah...

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

  // Metode lainnya tidak berubah...
}
