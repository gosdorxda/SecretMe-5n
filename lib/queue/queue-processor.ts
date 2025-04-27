import { notificationQueue } from "./notification-queue"
import { sendTelegramMessage } from "@/lib/telegram/service"
import type { NotificationQueueItem, ProcessingResult, BatchProcessingResult } from "./types"

export class QueueProcessor {
  private static instance: QueueProcessor

  private constructor() {}

  public static getInstance(): QueueProcessor {
    if (!QueueProcessor.instance) {
      QueueProcessor.instance = new QueueProcessor()
    }
    return QueueProcessor.instance
  }

  /**
   * Memproses antrian notifikasi
   */
  public async processQueue(limit = 10): Promise<{ success: number; failed: number }> {
    try {
      console.log(`Starting to process notification queue with limit: ${limit}`)

      // Ambil notifikasi dari antrian
      const notifications = await notificationQueue.dequeue(limit)

      if (notifications.length === 0) {
        console.log("No notifications to process")
        return { success: 0, failed: 0 }
      }

      console.log(`Processing ${notifications.length} notifications`)

      let successCount = 0
      let failedCount = 0

      // Proses setiap notifikasi
      for (const notification of notifications) {
        const startTime = performance.now()
        let success = false
        let errorMessage = ""

        try {
          // Proses berdasarkan channel
          if (notification.channel === "telegram") {
            success = await this.processTelegramNotification(notification)
          } else if (notification.channel === "whatsapp") {
            // TODO: Implementasi untuk WhatsApp
            success = false
            errorMessage = "WhatsApp channel not implemented yet"
          } else if (notification.channel === "email") {
            // TODO: Implementasi untuk Email
            success = false
            errorMessage = "Email channel not implemented yet"
          } else if (notification.channel === "in_app") {
            // TODO: Implementasi untuk In-App
            success = false
            errorMessage = "In-App channel not implemented yet"
          } else {
            success = false
            errorMessage = `Unknown channel: ${notification.channel}`
          }

          const endTime = performance.now()
          const processingTime = endTime - startTime

          // Update status notifikasi
          if (success) {
            await notificationQueue.markAsCompleted(notification.id, processingTime)
            successCount++
          } else {
            await notificationQueue.markAsFailed(notification.id, errorMessage || "Unknown error")
            failedCount++
          }
        } catch (error) {
          const endTime = performance.now()
          const processingTime = endTime - startTime

          console.error(`Error processing notification ${notification.id}:`, error)
          await notificationQueue.markAsFailed(
            notification.id,
            error instanceof Error ? error.message : "Unknown error",
          )
          failedCount++
        }
      }

      console.log(`Processed ${notifications.length} notifications: ${successCount} success, ${failedCount} failed`)
      return { success: successCount, failed: failedCount }
    } catch (error) {
      console.error("Error processing notification queue:", error)
      return { success: 0, failed: 0 }
    }
  }

  /**
   * Memproses antrian notifikasi dengan batch processing
   */
  public async processQueueWithBatches(
    batchSize = 10,
    channels: Array<"telegram" | "whatsapp" | "email" | "in_app"> = ["telegram"],
  ): Promise<Record<string, BatchProcessingResult>> {
    try {
      console.log(`Starting to process notification queue with batch size: ${batchSize}`)
      console.log(`Processing channels: ${channels.join(", ")}`)

      const results: Record<string, BatchProcessingResult> = {}

      // Proses setiap channel secara terpisah
      for (const channel of channels) {
        console.log(`Processing channel: ${channel}`)

        // Ambil batch notifikasi untuk channel ini
        const batch = await notificationQueue.dequeueBatch(batchSize, channel)

        if (!batch) {
          console.log(`No notifications to process for channel: ${channel}`)
          continue
        }

        console.log(`Processing batch of ${batch.size} notifications for channel: ${channel}`)

        const batchResult: BatchProcessingResult = {
          batchId: batch.id,
          results: [],
          successCount: 0,
          failureCount: 0,
          totalProcessingTime: 0,
          averageProcessingTime: 0,
        }

        // Proses batch berdasarkan channel
        if (channel === "telegram") {
          const telegramResults = await this.processTelegramBatch(batch.items)
          batchResult.results = telegramResults
        } else if (channel === "whatsapp") {
          // TODO: Implementasi untuk WhatsApp
          batchResult.results = batch.items.map((item) => ({
            id: item.id,
            success: false,
            error: "WhatsApp channel not implemented yet",
          }))
        } else if (channel === "email") {
          // TODO: Implementasi untuk Email
          batchResult.results = batch.items.map((item) => ({
            id: item.id,
            success: false,
            error: "Email channel not implemented yet",
          }))
        } else if (channel === "in_app") {
          // TODO: Implementasi untuk In-App
          batchResult.results = batch.items.map((item) => ({
            id: item.id,
            success: false,
            error: "In-App channel not implemented yet",
          }))
        }

        // Hitung statistik batch
        batchResult.successCount = batchResult.results.filter((r) => r.success).length
        batchResult.failureCount = batchResult.results.filter((r) => !r.success).length
        batchResult.totalProcessingTime = batchResult.results.reduce((sum, r) => sum + (r.processingTime || 0), 0)
        batchResult.averageProcessingTime =
          batchResult.results.length > 0 ? batchResult.totalProcessingTime / batchResult.results.length : 0

        // Update status notifikasi
        const successIds = batchResult.results.filter((r) => r.success).map((r) => r.id)
        const failedItems = batchResult.results
          .filter((r) => !r.success)
          .map((r) => ({ id: r.id, errorMessage: r.error || "Unknown error" }))

        const processingTimes = batchResult.results.reduce(
          (map, r) => {
            if (r.success && r.processingTime) {
              map[r.id] = r.processingTime
            }
            return map
          },
          {} as Record<string, number>,
        )

        // Update status notifikasi secara batch
        if (successIds.length > 0) {
          await notificationQueue.markBatchAsCompleted(successIds, processingTimes)
        }

        if (failedItems.length > 0) {
          await notificationQueue.markBatchAsFailed(failedItems)
        }

        results[channel] = batchResult
      }

      console.log("Batch processing completed")
      return results
    } catch (error) {
      console.error("Error processing notification queue with batches:", error)
      return {}
    }
  }

  /**
   * Memproses notifikasi Telegram
   */
  private async processTelegramNotification(notification: NotificationQueueItem): Promise<boolean> {
    try {
      console.log(`Processing Telegram notification: ${notification.id}`)

      // Pastikan payload ada dan tidak undefined
      const payload = notification.payload || {}

      // Ekstrak data dengan fallback untuk menghindari undefined
      const chatId = payload.chatId || payload.telegram_id || payload.telegramId || ""
      const text = payload.text || payload.message || payload.content || ""
      const parseMode = payload.parseMode || "Markdown"

      // Validasi data yang diperlukan
      if (!chatId) {
        console.error("Missing chatId/telegramId in notification payload")
        return false
      }

      if (!text) {
        console.error("Missing text/message/content in notification payload")
        return false
      }

      // Log data yang akan dikirim
      console.log(`Sending Telegram message to ${chatId} with parse mode ${parseMode}`)
      console.log(`Message text length: ${text.length} characters`)

      // Kirim pesan Telegram
      await sendTelegramMessage({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      })

      console.log(`Successfully sent Telegram message to ${chatId}`)
      return true
    } catch (error) {
      console.error("Error processing Telegram notification:", error)
      return false
    }
  }

  /**
   * Memproses batch notifikasi Telegram
   */
  private async processTelegramBatch(notifications: NotificationQueueItem[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = []

    for (const notification of notifications) {
      const startTime = performance.now()
      try {
        console.log(`Processing Telegram notification in batch: ${notification.id}`)

        // Pastikan payload ada dan tidak undefined
        const payload = notification.payload || {}

        // Ekstrak data dengan fallback untuk menghindari undefined
        const chatId = payload.chatId || payload.telegram_id || payload.telegramId || ""
        const text = payload.text || payload.message || payload.content || ""
        const parseMode = payload.parseMode || "Markdown"

        // Validasi data yang diperlukan
        if (!chatId) {
          console.error("Missing chatId/telegramId in notification payload")
          results.push({
            id: notification.id,
            success: false,
            error: "Missing chatId/telegramId in notification payload",
            processingTime: performance.now() - startTime,
          })
          continue
        }

        if (!text) {
          console.error("Missing text/message/content in notification payload")
          results.push({
            id: notification.id,
            success: false,
            error: "Missing text/message/content in notification payload",
            processingTime: performance.now() - startTime,
          })
          continue
        }

        // Log data yang akan dikirim
        console.log(`Sending Telegram message to ${chatId} with parse mode ${parseMode}`)
        console.log(`Message text length: ${text.length} characters`)

        // Kirim pesan Telegram
        await sendTelegramMessage({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode,
          disable_web_page_preview: false,
        })

        console.log(`Successfully sent Telegram message to ${chatId}`)
        results.push({
          id: notification.id,
          success: true,
          processingTime: performance.now() - startTime,
        })
      } catch (error) {
        console.error(`Error processing Telegram notification ${notification.id}:`, error)
        results.push({
          id: notification.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          processingTime: performance.now() - startTime,
        })
      }
    }

    return results
  }
}

// Export instance singleton untuk kemudahan penggunaan
export const queueProcessor = QueueProcessor.getInstance()
