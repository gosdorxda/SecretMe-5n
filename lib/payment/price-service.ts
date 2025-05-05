"use server"

import { createClient } from "@/lib/supabase/server"

export type PaymentMethodPrice = {
  id: string
  payment_gateway: string
  payment_method: string
  price: number
  created_at: string
  updated_at: string
}

// Fungsi untuk mendapatkan harga berdasarkan metode pembayaran
export async function getPriceForPaymentMethod(gatewayName: string, paymentMethod: string): Promise<number | null> {
  try {
    const supabase = createClient()

    // Cari harga khusus untuk metode pembayaran ini
    const { data, error } = await supabase
      .from("payment_method_prices")
      .select("price")
      .eq("payment_gateway", gatewayName)
      .eq("payment_method", paymentMethod)
      .single()

    if (error || !data) {
      console.log(`No specific price found for ${gatewayName}/${paymentMethod}`)
      return null
    }

    return data.price
  } catch (error) {
    console.error("Error getting price for payment method:", error)
    return null
  }
}

// Fungsi untuk mendapatkan semua harga metode pembayaran
export async function getAllPaymentMethodPrices(): Promise<PaymentMethodPrice[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("payment_method_prices")
      .select("*")
      .order("payment_gateway", { ascending: true })
      .order("payment_method", { ascending: true })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error getting all payment method prices:", error)
    return []
  }
}

// Fungsi untuk memperbarui harga metode pembayaran
export async function updatePaymentMethodPrice(
  gatewayName: string,
  paymentMethod: string,
  price: number,
): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("payment_method_prices")
      .update({ price, updated_at: new Date().toISOString() })
      .eq("payment_gateway", gatewayName)
      .eq("payment_method", paymentMethod)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error updating payment method price:", error)
    return false
  }
}
