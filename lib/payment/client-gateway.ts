"use client"

import type { PaymentMethod } from "./types"

export async function getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch("/api/payment/methods?gateway=tripay", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch payment methods")
    }

    const data = await response.json()
    return data.methods || []
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return []
  }
}

export async function createTransaction(
  paymentMethod: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
) {
  try {
    const response = await fetch("/api/payment/create-transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gateway: "tripay",
        method: paymentMethod,
        amount,
        customerName,
        customerEmail,
        customerPhone,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to create transaction")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating transaction:", error)
    throw error
  }
}
