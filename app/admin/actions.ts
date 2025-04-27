"use server"

import { QueueProcessor } from "@/lib/queue/queue-processor"
import { NotificationQueue } from "@/lib/queue/notification-queue"

/**
 * Server action untuk memproses antrian notifikasi
 */
export async function processNotificationQueue(batchSize = 20) {
  try {
    const processor = QueueProcessor.getInstance()
    const processedCount = await processor.processQueue(batchSize)

    return {
      success: true,
      processedCount,
    }
  } catch (error) {
    console.error("Error processing notification queue:", error)
    return {
      success: false,
      error: "Failed to process notification queue",
    }
  }
}

/**
 * Server action untuk membersihkan item antrian yang lama
 */
export async function cleanupOldQueueItems(daysToKeep = 7) {
  try {
    const queue = NotificationQueue.getInstance()
    const cleanedCount = await queue.cleanupOldItems(daysToKeep)

    return {
      success: true,
      cleanedCount,
    }
  } catch (error) {
    console.error("Error cleaning up old queue items:", error)
    return {
      success: false,
      error: "Failed to clean up old queue items",
    }
  }
}

/**
 * Server action untuk mendapatkan statistik antrian
 */
export async function getQueueStats() {
  try {
    const queue = NotificationQueue.getInstance()
    const stats = await queue.getStats()

    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error("Error getting queue stats:", error)
    return {
      success: false,
      error: "Failed to get queue stats",
    }
  }
}
