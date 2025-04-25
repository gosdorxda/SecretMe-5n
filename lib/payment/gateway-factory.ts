import type { PaymentGateway } from "./types"
import { DuitkuGateway } from "./duitku-gateway"
import { createClient } from "@/lib/supabase/client"

// Simpan instance gateway dalam cache
const gatewayInstances: Record<string, PaymentGateway> = {}

/**
 * Factory function untuk mendapatkan gateway pembayaran
 */
export async function getPaymentGateway(name?: string): Promise<PaymentGateway> {
  try {
    // Jika nama gateway tidak diberikan, ambil dari konfigurasi
    if (!name) {
      const config = await getPaymentConfig()
      name = config.activeGateway
    }

    // Jika gateway sudah ada di cache, gunakan instance yang ada
    if (gatewayInstances[name]) {
      return gatewayInstances[name]
    }

    // Buat instance gateway baru berdasarkan nama
    let gateway: PaymentGateway

    switch (name.toLowerCase()) {
      case "duitku": {
        gateway = new DuitkuGateway()
        break
      }
      case "xendit": {
        const { XenditGateway } = await import("./xendit-gateway")
        gateway = new XenditGateway()
        break
      }
      default:
        throw new Error(`Payment gateway "${name}" not supported`)
    }

    // Simpan instance di cache
    gatewayInstances[name] = gateway
    return gateway
  } catch (error) {
    console.error("Error getting payment gateway:", error)
    throw new Error("Failed to initialize payment gateway")
  }
}

/**
 * Mendapatkan konfigurasi pembayaran dari database
 */
export async function getPaymentConfig() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("site_config")
    .select("config")
    .eq("type", "payment_gateway_config")
    .single()

  if (error) {
    console.error("Error loading payment config:", error)
    // Default config jika tidak ada di database
    return {
      activeGateway: "duitku",
      gateways: {
        duitku: {
          merchantCode: process.env.DUITKU_MERCHANT_CODE || "",
          apiKey: process.env.DUITKU_API_KEY || "",
          isProduction: true,
        },
      },
    }
  }

  return data.config
}

/**
 * Menyimpan konfigurasi pembayaran ke database
 */
export async function savePaymentConfig(config: any) {
  const supabase = createClient()

  const { error } = await supabase.from("site_config").upsert(
    {
      type: "payment_gateway_config",
      config: config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "type" },
  )

  if (error) {
    console.error("Error saving payment config:", error)
    throw new Error("Failed to save payment configuration")
  }

  // Reset cache setelah konfigurasi diubah
  Object.keys(gatewayInstances).forEach((key) => {
    delete gatewayInstances[key]
  })

  return { success: true }
}
