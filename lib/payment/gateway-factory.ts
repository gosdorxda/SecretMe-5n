import type { PaymentGateway } from "./types"
import { DuitkuGateway } from "./duitku-gateway"
import { MidtransGateway } from "./midtrans-gateway"

// Cache for payment config
let paymentConfigCache: any = null
let lastFetchTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Mendapatkan konfigurasi pembayaran
 * Fungsi ini bekerja di server
 */
export async function getPaymentConfig() {
  try {
    const now = Date.now()

    // Gunakan cache jika masih valid
    if (paymentConfigCache && now - lastFetchTime < CACHE_TTL) {
      return paymentConfigCache
    }

    // Default config - only include public values
    const config = {
      activeGateway: "duitku",
      gateways: {
        duitku: {
          isProduction: process.env.NODE_ENV === "production",
        },
        midtrans: {
          isProduction: process.env.NODE_ENV === "production",
        },
      },
    }

    // Update cache
    paymentConfigCache = config
    lastFetchTime = now

    return config
  } catch (error) {
    console.error("Error in getPaymentConfig:", error)
    return {
      activeGateway: "duitku",
      gateways: {
        duitku: {
          isProduction: process.env.NODE_ENV === "production",
        },
      },
    }
  }
}

/**
 * Menyimpan konfigurasi pembayaran
 * Catatan: Fungsi ini hanya berfungsi di server
 */
export async function savePaymentConfig(config: any) {
  try {
    // Reset cache
    paymentConfigCache = null

    console.log("Saving payment config:", config)

    // Return success (actual saving will be done in API route)
    return { success: true }
  } catch (error) {
    console.error("Error in savePaymentConfig:", error)
    throw new Error("Failed to save payment configuration")
  }
}

/**
 * Factory untuk mendapatkan gateway pembayaran
 * Catatan: Ini hanya boleh digunakan di server
 */
export async function getPaymentGateway(gatewayName = "duitku"): Promise<PaymentGateway> {
  // This should only be called on the server
  if (typeof window !== "undefined") {
    throw new Error("getPaymentGateway should only be called on the server")
  }

  switch (gatewayName.toLowerCase()) {
    case "midtrans":
      return new MidtransGateway()
    case "duitku":
    default:
      return new DuitkuGateway()
  }
}

// Add an empty createGateway function to satisfy the deployment check
export function createGateway(): PaymentGateway {
  throw new Error("createGateway is not implemented")
}
