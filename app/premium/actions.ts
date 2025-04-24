"use server"

import { createClient } from "@/lib/supabase/server"
import { generateOrderId, getMidtransSnapApiUrl, getMidtransAuthHeader, MIDTRANS_CONFIG } from "@/lib/midtrans"
import { revalidatePath } from "next/cache"

// Tipe untuk hasil transaksi
type TransactionResult = {
  success: boolean
  redirectUrl?: string
  error?: string
}

// Server action untuk membuat transaksi
export async function createTransaction(): Promise<TransactionResult> {
  try {
    // Dapatkan user yang sedang login
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Generate order ID
    const orderId = generateOrderId(user.id)

    // Dapatkan data user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error getting user data:", userError)
      return { success: false, error: "Failed to get user data" }
    }

    // Buat transaksi di database
    const { data: transaction, error: transactionError } = await supabase
      .from("premium_transactions")
      .insert({
        user_id: user.id,
        plan_id: orderId,
        amount: MIDTRANS_CONFIG.premiumPrice,
        status: "pending",
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return { success: false, error: `Failed to create transaction: ${transactionError.message}` }
    }

    // Buat request ke Midtrans
    const midtransUrl = getMidtransSnapApiUrl()
    const authHeader = getMidtransAuthHeader()

    const requestBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: MIDTRANS_CONFIG.premiumPrice,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: userData.name || user.email?.split("@")[0] || "User",
        email: userData.email || user.email,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL}/premium?payment=error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=pending`,
      },
    }

    console.log("Sending request to Midtrans:", midtransUrl)
    console.log("Request body:", JSON.stringify(requestBody))

    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("Midtrans error:", responseData)

      // Hapus transaksi dari database jika gagal
      await supabase.from("premium_transactions").delete().eq("id", transaction.id)

      return {
        success: false,
        error: `Midtrans error: ${JSON.stringify(responseData)}`,
      }
    }

    console.log("Midtrans response:", responseData)

    // Update transaksi dengan token dari Midtrans
    await supabase
      .from("premium_transactions")
      .update({
        payment_method: "midtrans",
        payment_details: responseData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    revalidatePath("/premium")
    revalidatePath("/dashboard")

    return {
      success: true,
      redirectUrl: responseData.redirect_url,
    }
  } catch (error) {
    console.error("Transaction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
