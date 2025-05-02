import { createClient } from "@/lib/supabase/server"
import { PaymentLogger } from "./logger"

export class TransactionMonitor {
  private logger: PaymentLogger

  constructor(requestId: string) {
    this.logger = new PaymentLogger(requestId, "transaction-monitor")
  }

  /**
   * Mencatat transaksi ke database dan memastikan status konsisten
   */
  async monitorTransaction(transactionId: string, status: string, details: any): Promise<void> {
    try {
      this.logger.info(`Monitoring transaction ${transactionId}`, { status })

      // Dapatkan data transaksi dari database
      const supabase = createClient()
      const { data: transaction, error } = await supabase
        .from("premium_transactions")
        .select("id, user_id, status, payment_gateway, payment_method")
        .eq("id", transactionId)
        .single()

      if (error) {
        this.logger.error(`Failed to get transaction ${transactionId}`, error)
        return
      }

      // Periksa apakah status perlu diupdate
      if (transaction.status !== status) {
        this.logger.info(`Updating transaction status from ${transaction.status} to ${status}`)

        // Update status transaksi
        const { error: updateError } = await supabase
          .from("premium_transactions")
          .update({
            status,
            payment_details: details,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transactionId)

        if (updateError) {
          this.logger.error(`Failed to update transaction ${transactionId}`, updateError)
          return
        }

        // Jika status berubah menjadi success, update status premium user
        if (status === "success") {
          this.logger.info(`Upgrading user ${transaction.user_id} to premium`)

          const { error: userUpdateError } = await supabase
            .from("users")
            .update({
              is_premium: true,
              premium_expires_at: null, // Lifetime premium
            })
            .eq("id", transaction.user_id)

          if (userUpdateError) {
            this.logger.error(`Failed to update user premium status`, userUpdateError)
          }
        }
      } else {
        this.logger.debug(`Transaction ${transactionId} already has status ${status}`)
      }
    } catch (error) {
      this.logger.error(`Error monitoring transaction`, error)
    }
  }
}
