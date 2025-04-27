import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NotificationQueue } from "./notification-queue"
import type { NotificationQueueItem, BatchProcessingOptions } from "./types"
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

        const startTime = Date.now()
        await this.processItem(item)
        const processingTime = (Date.now() - startTime) / 1000 // Konversi ke detik

        await this.queue.markAsCompleted(item.id, processingTime)
        processedCount++
      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error)
        await this.queue.markAsFailed(item.id, error instanceof Error ? error.message : "Unknown error")
      }
    }

    return processedCount
  }

  /**
   * Memproses antrian notifikasi dengan batch processing
   */
  public async processQueueWithBatches(
    options: BatchProcessingOptions = {
      batchSize: 20,
      maxBatches: 5,
      channelConcurrency: {
        telegram: 2,
        whatsapp: 2,
        email: 3,
        in_app: 5,
      },
    },
  ): Promise<{
    processedCount: number
    batchesProcessed: number
    processingTime: number
    channelStats: Record<string, { count: number; time: number }>
  }> {
    const startTime = Date.now()
    let processedCount = 0
    let batchesProcessed = 0
    const channelStats: Record<string, { count: number; time: number }> = {}

    // Proses batch untuk setiap channel
    const channels: Array<"telegram" | "whatsapp" | "email" | "in_app"> = ["telegram", "whatsapp", "email", "in_app"]

    for (const channel of channels) {
      const concurrency = options.channelConcurrency[channel] || 1
      const channelStartTime = Date.now()
      let channelProcessedCount = 0

      // Proses beberapa batch secara paralel untuk channel ini
      const batchPromises: Promise<number>[] = []

      for (let i = 0; i < concurrency && batchesProcessed < options.maxBatches; i++) {
        const batchPromise = this.processBatchForChannel(channel, options.batchSize).then((count) => {
          if (count > 0) {
            batchesProcessed++
          }
          return count
        })

        batchPromises.push(batchPromise)
      }

      // Tunggu semua batch selesai
      const results = await Promise.all(batchPromises)
      channelProcessedCount = results.reduce((sum, count) => sum + count, 0)
      processedCount += channelProcessedCount

      // Catat statistik channel
      channelStats[channel] = {
        count: channelProcessedCount,
        time: (Date.now() - channelStartTime) / 1000, // Konversi ke detik
      }
    }

    const totalProcessingTime = (Date.now() - startTime) / 1000 // Konversi ke detik

    return {
      processedCount,
      batchesProcessed,
      processingTime: totalProcessingTime,
      channelStats,
    }
  }

  /**
   * Memproses batch untuk channel tertentu
   */
  private async processBatchForChannel(
    channel: "telegram" | "whatsapp" | "email" | "in_app",
    batchSize: number,
  ): Promise<number> {
    // Ambil batch untuk channel ini
    const batch = await this.queue.dequeueBatch(batchSize, channel)

    if (!batch || batch.items.length === 0) {
      return 0
    }

    console.log(`Processing batch of ${batch.items.length} ${channel} notifications`)

    let processedCount = 0
    const processingTimes: Record<string, number> = {}
    const failedItems: Array<{ id: string; errorMessage: string }> = []

    // Proses setiap item dalam batch
    for (const item of batch.items) {
      try {
        const startTime = Date.now()
        await this.processItem(item)
        const processingTime = (Date.now() - startTime) / 1000 // Konversi ke detik

        processingTimes[item.id] = processingTime
        processedCount++
      } catch (error) {
        console.error(`Error processing batch item ${item.id}:`, error)
        failedItems.push({
          id: item.id,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Tandai item yang berhasil sebagai selesai
    const successIds = batch.items
      .filter((item) => !failedItems.some((failedItem) => failedItem.id === item.id))
      .map((item) => item.id)

    if (successIds.length > 0) {
      await this.queue.markBatchAsCompleted(successIds, processingTimes)
    }

    // Tandai item yang gagal
    if (failedItems.length > 0) {
      await this.queue.markBatchAsFailed(failedItems)
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
    const name = payload.name || "pengguna"
    const messagePreview = payload.messagePreview || payload.preview || ""
    const profileUrl = payload.profileUrl || payload.url || ""
    const messageId = payload.messageId || ""

    // Buat teks pesan berdasarkan data yang tersedia
    let messageText = payload.text || payload.message || payload.content

    // Jika tidak ada teks pesan, buat pesan berdasarkan data lain yang tersedia
    if (!messageText) {
      if (item.notification_type === "new_message" || item.notification_type === "telegram_message") {
        messageText = `🔔 *Pesan Baru*\n\nHalo ${name}, Anda menerima pesan baru di SecretMe!\n\n`

        if (messagePreview) {
          messageText += `📝 Pesan: "${messagePreview}"\n\n`
        }

        if (profileUrl) {
          messageText += `🔗 [Lihat Pesan](${profileUrl})`
        }
      } else {
        // Fallback untuk jenis notifikasi lain
        messageText = `🔔 *Notifikasi*\n\nHalo ${name}, Anda memiliki notifikasi baru di SecretMe.`

        if (profileUrl) {
          messageText += `\n\n🔗 [Buka SecretMe](${profileUrl})`
        }
      }
    }

    console.log(`Processing Telegram notification with chatId: ${chatId}, text: ${messageText}`)

    // Validasi field yang diperlukan
    if (!chatId) {
      // Jika chatId tidak ada dalam payload, coba ambil dari database
      const userId = item.user_id
      if (!userId) {
        throw new Error("No user ID or chat ID available for Telegram notification")
      }

      // Ambil telegram_id dari database
      const supabase = createClient(cookies())
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

      // Kirim pesan Telegram
      await sendTelegramMessage({
        chat_id: telegramId,
        text: messageText,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      })
    } else {
      // Kirim pesan Telegram
      await sendTelegramMessage({
        chat_id: chatId,
        text: messageText,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      })
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

export const queueProcessor = QueueProcessor.getInstance()
