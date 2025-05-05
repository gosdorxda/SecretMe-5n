import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "./payment-logger"

type FraudCheckResult = {
  isSuspicious: boolean
  riskLevel: "low" | "medium" | "high"
  reasons: string[]
}

export async function checkForFraud(
  userId: string,
  transactionId: string,
  paymentDetails: any,
): Promise<FraudCheckResult> {
  const logger = createPaymentLogger("fraud-detector")
  const supabase = createClient()
  const reasons: string[] = []

  try {
    // 1. Check for multiple failed transactions
    const { data: failedTransactions, error: failedError } = await supabase
      .from("premium_transactions")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(10)

    if (!failedError && failedTransactions && failedTransactions.length >= 5) {
      // Check if there are 5+ failed transactions in the last hour
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const recentFailures = failedTransactions.filter((tx) => new Date(tx.created_at) > oneHourAgo)

      if (recentFailures.length >= 5) {
        reasons.push("multiple_recent_failures")
      }
    }

    // 2. Check for unusual payment amount
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    let expectedPrice = Number.parseInt(process.env.PREMIUM_PRICE || "49000")

    if (configData?.config?.price) {
      expectedPrice = Number.parseInt(configData.config.price.toString())
    }

    const transactionAmount = paymentDetails.amount || 0

    // If amount differs by more than 10%
    if (Math.abs(transactionAmount - expectedPrice) / expectedPrice > 0.1) {
      reasons.push("unusual_amount")
    }

    // 3. Check for multiple accounts from same IP
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("last_ip")
      .eq("id", userId)
      .single()

    if (!userError && userData && userData.last_ip) {
      const { data: ipUsers, error: ipError } = await supabase
        .from("users")
        .select("id")
        .eq("last_ip", userData.last_ip)
        .neq("id", userId)

      if (!ipError && ipUsers && ipUsers.length > 3) {
        reasons.push("multiple_accounts_same_ip")
      }
    }

    // 4. Check for rapid succession transactions
    const { data: recentTransactions, error: recentError } = await supabase
      .from("premium_transactions")
      .select("id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (!recentError && recentTransactions && recentTransactions.length >= 2) {
      const latestTx = new Date(recentTransactions[0].created_at)
      const secondLatestTx = new Date(recentTransactions[1].created_at)

      // If less than 30 seconds between transactions
      const timeDiffSeconds = (latestTx.getTime() - secondLatestTx.getTime()) / 1000
      if (timeDiffSeconds < 30) {
        reasons.push("rapid_transactions")
      }
    }

    // 5. Check account age
    const { data: accountData, error: accountError } = await supabase
      .from("users")
      .select("created_at")
      .eq("id", userId)
      .single()

    if (!accountError && accountData) {
      const accountAge = new Date().getTime() - new Date(accountData.created_at).getTime()
      const accountAgeHours = accountAge / (1000 * 60 * 60)

      if (accountAgeHours < 1) {
        reasons.push("new_account")
      }
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low"

    if (reasons.length >= 3) {
      riskLevel = "high"
    } else if (reasons.length >= 1) {
      riskLevel = "medium"
    }

    // Log fraud check results
    if (reasons.length > 0) {
      logger.warn("Potential fraud detected", {
        userId,
        transactionId,
        riskLevel,
        reasons,
      })

      // Log to database for review
      await supabase.from("payment_notification_logs").insert({
        request_id: `fraud-check-${Date.now()}`,
        gateway: paymentDetails.gateway || "unknown",
        raw_payload: {
          action: "fraud-check",
          userId,
          transactionId,
          riskLevel,
          reasons,
        },
        status: "fraud_check",
        transaction_id: transactionId,
        event_type: "security_alert",
      })
    }

    return {
      isSuspicious: reasons.length > 0,
      riskLevel,
      reasons,
    }
  } catch (error) {
    logger.error("Error in fraud detection", error)
    return {
      isSuspicious: false,
      riskLevel: "low",
      reasons: ["error_in_fraud_check"],
    }
  }
}
