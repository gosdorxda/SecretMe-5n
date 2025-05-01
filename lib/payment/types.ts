/**
 * Interface dasar untuk semua gateway pembayaran
 */
export interface PaymentGateway {
  name: string

  /**
   * Membuat transaksi baru
   */
  createTransaction(params: CreateTransactionParams): Promise<CreateTransactionResult>

  /**
   * Memverifikasi status transaksi
   */
  verifyTransaction(orderId: string): Promise<VerifyTransactionResult>

  /**
   * Menangani notifikasi webhook dari gateway pembayaran
   */
  handleNotification(payload: any): Promise<NotificationResult>
}

export interface CreateTransactionParams {
  userId: string
  userEmail: string
  userName: string
  amount: number
  orderId: string
  description: string
  successRedirectUrl: string
  failureRedirectUrl: string
  pendingRedirectUrl: string
  notificationUrl: string
  paymentMethod?: string // Tambahkan parameter metode pembayaran
}

export interface CreateTransactionResult {
  success: boolean
  redirectUrl?: string
  token?: string
  error?: string
  gatewayReference?: string
}

export interface VerifyTransactionResult {
  isValid: boolean
  status: PaymentStatus
  amount?: number
  paymentMethod?: string
  details?: any
}

// Tambahkan tipe untuk event callback

export interface NotificationResult {
  orderId: string
  status: PaymentStatus
  isSuccess: boolean
  amount: number
  paymentMethod: string
  details: any
  eventType?: string // Tambahkan field untuk jenis event
}

// Tambahkan tipe refund ke PaymentStatus
export type PaymentStatus = "pending" | "success" | "failed" | "expired" | "refunded" | "unknown"

/**
 * Fungsi untuk menghasilkan ID pesanan unik
 */
export function generateOrderId(userId: string): string {
  const timestamp = new Date().getTime()
  const random = Math.floor(Math.random() * 1000)
  return `ORDER-${userId.substring(0, 8)}-${timestamp}-${random}`
}

/**
 * Fungsi untuk memformat status pembayaran
 */
export function formatPaymentStatus(status: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    pending: "pending",
    success: "success",
    settlement: "success",
    capture: "success",
    failed: "failed",
    cancel: "failed",
    deny: "failed",
    expire: "expired",
    expired: "expired",
    refund: "refunded",
    refunded: "refunded",
  }

  return statusMap[status.toLowerCase()] || "unknown"
}
