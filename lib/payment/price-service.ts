"use server"

import { createClient } from "@/lib/supabase/server"

// Type definitions
export type PaymentMethodPrice = {
  id: string
  payment_gateway: string
  payment_method: string
  price: number
  created_at: string
  updated_at: string
}

/**
 * Get price for a specific payment method
 */
export async function getPriceForPaymentMethod(gateway: string, method: string): Promise<number | null> {
  try {
    const supabase = createClient()

    // Try to get the specific price for this method
    const { data, error } = await supabase
      .from("payment_method_prices")
      .select("price")
      .eq("payment_gateway", gateway)
      .eq("payment_method", method)
      .single()

    if (error || !data) {
      console.log(`No specific price found for ${gateway}/${method}, using default price`)
      return null
    }

    return data.price
  } catch (error) {
    console.error("Error fetching price for payment method:", error)
    return null
  }
}

/**
 * Get all prices for all payment methods
 */
export async function getAllPaymentMethodPrices(): Promise<PaymentMethodPrice[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("payment_method_prices")
      .select("*")
      .order("payment_gateway", { ascending: true })
      .order("payment_method", { ascending: true })

    if (error) {
      console.error("Error fetching payment method prices:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching all payment method prices:", error)
    return []
  }
}

/**
 * Update price for a specific payment method
 */
export async function updatePaymentMethodPrice(gateway: string, method: string, price: number): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("payment_method_prices").upsert(
      {
        payment_gateway: gateway,
        payment_method: method,
        price: price,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "payment_gateway,payment_method" },
    )

    if (error) {
      console.error("Error updating payment method price:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating payment method price:", error)
    return false
  }
}
