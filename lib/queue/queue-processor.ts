import { createClient } from "@/lib/supabase/server"
import { NotificationQueue } from "./notification-queue"
import type { NotificationQueueItem } from "./types"
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
    // Ambil item dari antrian
    const items = await this.queue.dequeue(batchSize)

    if (items.length === 0) {
      return 0
    }

    let processedCount = 0

    // Proses setiap item
    for (const item of items) {
      try {
        console.log(`Processing queue item ${item.id}, channel: ${item.channel}, type: ${item.notification_type}`)
        console.log(`Payload:`, JSON.stringify(item.payload, null, 2))

        await this.processItem(item)
        await this.queue.markAsCompleted(item.id)
        processedCount++
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error)
        await this.queue.markAsFailed(item.id, error instanceof Error ? error.message : "Unknown error")
      }
    }

    return processedCount
  }

  /**
   * Memproses satu item antrian
   */
  private async processItem(item: NotificationQueueItem): Promise<void> {
    switch (item.channel) {
      case "telegram":
        await this.processTelegramNotification(item)
        break
      case "whatsapp":
        await this.processWhatsappNotification(item)
        break
      case "email":
        await this.processEmailNotification(item)
        break
      case "in_app":
        await this.processInAppNotification(item)
        break
      default:
        throw new Error(`Unsupported notification channel: ${item.channel}`)
    }
  }

  /**
   * Memproses notifikasi Telegram
   */
  private async processTelegramNotification(item: NotificationQueueItem): Promise<void> {
    // Ekstrak payload dengan penanganan error yang lebih baik
    const payload = item.payload || {}

    // Cek apakah payload memiliki format yang benar
    if (!payload) {
      throw new Error("Empty payload for Telegram notification")
    }

    // Ekstrak field yang diperlukan dengan fallback
    const chatId = payload.chatId || payload.telegram_id || payload.telegramId
    const text = payload.text || payload.message || payload.content
    const parseMode = payload.parseMode || payload.parse_mode || "Markdown"

    console.log(`Processing Telegram notification with chatId: ${chatId}, text length: ${text?.length || 0}`)

    // Validasi field yang diperlukan
    if (!chatId) {
      // Jika chatId tidak ada dalam payload, coba ambil dari database
      const userId = item.user_id
      if (!userId) {
        throw new Error("No user ID or chat ID available for Telegram notification")
      }

      // Ambil telegram_id dari database
      const supabase = createClient()
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("telegram_id")
        .eq("id", userId)
        .single()

      if (userError || !userData?.telegram_id) {
        throw new Error(
          `Failed to get Telegram ID for user ${userId}: ${userError?.message || "User has no Telegram ID"}`,
        )
      }

      // Gunakan telegram_id dari database
      const telegramId = userData.telegram_id

      // Validasi text
      if (!text) {
        throw new Error("Missing text field for Telegram notification")
      }

      // Kirim pesan Telegram
      await sendTelegramMessage(telegramId, text, parseMode)
    } else {
      // Validasi text
      if (!text) {
        throw new Error("Missing text field for Telegram notification")
      }

      // Kirim pesan Telegram
      await sendTelegramMessage(chatId, text, parseMode)
    }
  }

  /**
   * Memproses notifikasi WhatsApp
   */
  private async processWhatsappNotification(item: NotificationQueueItem): Promise<void> {
    // Implementasi untuk WhatsApp
    throw new Error("WhatsApp notification processing not implemented yet")
  }

  /**
   * Memproses notifikasi Email
   */
  private async processEmailNotification(item: NotificationQueueItem): Promise<void> {
    // Implementasi untuk Email
    throw new Error("Email notification processing not implemented yet")
  }

  /**
   * Memproses notifikasi In-App
   */
  private async processInAppNotification(item: NotificationQueueItem): Promise<void> {
    // Implementasi untuk In-App
    throw new Error("In-App notification processing not implemented yet")
  }
}
