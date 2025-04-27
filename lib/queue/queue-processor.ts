import { createClient } from "@/lib/supabase/server"
import { NotificationQueue } from "./notification-queue"
import type { NotificationQueueItem, ProcessResult } from "./types"
import { sendTelegramMessage } from "@/lib/telegram/service"

export class QueueProcessor {
  private static instance: QueueProcessor
  private queue: NotificationQueue

  private constructor() {
    this.queue = NotificationQueue.getInstance()
  }

  public static getInstance(): QueueProcessor {
    if (!QueueProcessor.instance) {
      QueueProcessor.instance = new QueueProcessor()
    }
    return QueueProcessor.instance
  }

  /**
   * Memproses antrian notifikasi
   */
  public async processQueue(batchSize = 10): Promise<number> {
    try {
      // Ambil notifikasi dari antrian
      const items = await this.queue.dequeue(batchSize)

      if (items.length === 0) {
        return 0
      }

      // Proses setiap notifikasi
      const processPromises = items.map((item) => this.processItem(item))
      await Promise.all(processPromises)

      return items.length
    } catch (error) {
      console.error("Error processing queue:", error)
      return 0
    }
  }

  /**
   * Memproses satu item notifikasi
   */
  private async processItem(item: NotificationQueueItem): Promise<void> {
    try {
      console.log(`Processing notification ${item.id} of type ${item.notification_type} via ${item.channel}`)

      let result: ProcessResult

      // Proses berdasarkan channel
      switch (item.channel) {
        case "telegram":
          result = await this.processTelegramNotification(item)
          break
        case "whatsapp":
          result = await this.processWhatsAppNotification(item)
          break
        case "email":
          result = await this.processEmailNotification(item)
          break
        case "in_app":
          result = await this.processInAppNotification(item)
          break
        default:
          result = {
            success: false,
            error: `Unsupported channel: ${item.channel}`,
          }
      }

      // Update status notifikasi
      if (result.success) {
        await this.queue.markAsCompleted(item.id)
      } else {
        await this.queue.markAsFailed(item.id, result.error || "Unknown error")
      }
    } catch (error) {
      console.error(`Error processing notification ${item.id}:`, error)
      await this.queue.markAsFailed(item.id, error instanceof Error ? error.message : "Unknown error")
    }
  }

  /**
   * Memproses notifikasi Telegram
   */
  private async processTelegramNotification(item: NotificationQueueItem): Promise<ProcessResult> {
    try {
      const supabase = createClient()

      // Ambil ID Telegram pengguna
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("telegram_id")
        .eq("id", item.user_id)
        .single()

      if (userError || !userData?.telegram_id) {
        return {
          success: false,
          error: userError?.message || "User does not have a Telegram ID",
        }
      }

      // Kirim pesan ke Telegram
      const telegramId = userData.telegram_id
      const message = item.payload.message || "You have a new notification"

      const result = await sendTelegramMessage(telegramId, message)

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to send Telegram message",
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error in Telegram notification",
      }
    }
  }

  /**
   * Memproses notifikasi WhatsApp
   */
  private async processWhatsAppNotification(item: NotificationQueueItem): Promise<ProcessResult> {
    // Implementasi untuk WhatsApp akan ditambahkan nanti
    return {
      success: false,
      error: "WhatsApp notification processing not implemented yet",
    }
  }

  /**
   * Memproses notifikasi Email
   */
  private async processEmailNotification(item: NotificationQueueItem): Promise<ProcessResult> {
    // Implementasi untuk Email akan ditambahkan nanti
    return {
      success: false,
      error: "Email notification processing not implemented yet",
    }
  }

  /**
   * Memproses notifikasi In-App
   */
  private async processInAppNotification(item: NotificationQueueItem): Promise<ProcessResult> {
    // Implementasi untuk In-App akan ditambahkan nanti
    return {
      success: false,
      error: "In-App notification processing not implemented yet",
    }
  }
}
