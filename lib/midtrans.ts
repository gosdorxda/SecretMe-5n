// Konfigurasi Midtrans
export const MIDTRANS_CONFIG = {
  isProduction: true, // Ubah ke false jika menggunakan sandbox
  serverKey: process.env.MIDTRANS_SERVER_KEY || "",
  premiumPrice: Number.parseInt(process.env.PREMIUM_PRICE || "49000"),
}

// Generate order ID unik
export function generateOrderId(userId: string): string {
  const timestamp = new Date().getTime()
  const random = Math.floor(Math.random() * 1000)
  return `ORDER-${userId.substring(0, 8)}-${timestamp}-${random}`
}

// Mendapatkan Snap API URL Midtrans
export function getMidtransSnapApiUrl(): string {
  return MIDTRANS_CONFIG.isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions"
}

// Mendapatkan Snap JS URL Midtrans (tanpa menggunakan client key)
export function getMidtransSnapJsUrl(): string {
  return MIDTRANS_CONFIG.isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js"
}

// Mendapatkan Core API URL untuk status transaksi
export function getMidtransCoreApiUrl(): string {
  return MIDTRANS_CONFIG.isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"
}

// Fungsi untuk membuat Basic Auth header
export function getMidtransAuthHeader(): string {
  // Pastikan server key diisi dengan benar
  const authString = `${MIDTRANS_CONFIG.serverKey}:`
  return `Basic ${Buffer.from(authString).toString("base64")}`
}
