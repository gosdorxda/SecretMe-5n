import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "./payment-logger"

export async function validateTransaction(
  userId: string,
  amount: number,
): Promise<{
  valid: boolean
  reason?: string
  existingTransaction?: any
}> {
  const logger = createPaymentLogger("transaction-validator")
  const supabase = createClient()

  try {
    // 1. Periksa apakah user sudah premium
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_premium")
      .eq("id", userId)
      .single()

    if (userError) {
      logger.error("Error checking user premium status", userError)
      return { valid: false, reason: "user_not_found" }
    }

    if (userData.is_premium) {
      logger.warn("User is already premium", { userId })
      return { valid: false, reason: "already_premium" }
    }

    // 2. Periksa transaksi yang masih pending dalam 30 menit terakhir
    const thirtyMinutesAgo = new Date()
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)

    const { data: pendingTransactions, error: pendingError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gt("created_at", thirtyMinutesAgo.toISOString())

    if (pendingError) {
      logger.error("Error checking pending transactions", pendingError)
      // Continue despite error
    } else if (pendingTransactions && pendingTransactions.length > 0) {
      logger.warn("User has pending transaction", {
        userId,
        transactionId: pendingTransactions[0].id,
      })
      return {
        valid: false,
        reason: "pending_transaction",
        existingTransaction: pendingTransactions[0],
      }
    }

    // 3. Periksa transaksi sukses dalam 24 jam terakhir
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: successTransactions, error: successError } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "success")
      .gt("created_at", twentyFourHoursAgo.toISOString())

    if (successError) {
      logger.error("Error checking success transactions", successError)
      // Continue despite error
    } else if (successTransactions && successTransactions.length > 0) {
      logger.warn("User has successful transaction in last 24 hours", {
        userId,
        transactionId: successTransactions[0].id,
      })
      return {
        valid: false,
        reason: "recent_success",
        existingTransaction: successTransactions[0],
      }
    }

    // 4. Validasi jumlah pembayaran
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    let validAmount = Number.parseInt(process.env.PREMIUM_PRICE || "49000")

    if (configData?.config?.price) {
      validAmount = Number.parseInt(configData.config.price.toString())
    }

    // Toleransi 1% untuk perbedaan pembulatan
    const tolerance = validAmount * 0.01
    if (Math.abs(amount - validAmount) > tolerance) {
      logger.warn("Invalid payment amount", {
        userId,
        expected: validAmount,
        received: amount,
      })
      return { valid: false, reason: "invalid_amount" }
    }

    return { valid: true }
  } catch (error) {
    logger.error("Error validating transaction", error)
    return { valid: false, reason: "validation_error" }
  }
}
