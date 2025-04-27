"use server"
import { queueProcessor } from "@/lib/queue/queue-processor"
import { notificationQueue } from "@/lib/queue/notification-queue"
import { revalidatePath } from "next/cache"

export async function processQueue() {
  try {
    // Process the queue with batch processing
    const batchSize = 10
    const channels = ["telegram"] as const
    const results = await queueProcessor.processQueueWithBatches(batchSize, channels)

    // Calculate total statistics
    let totalSuccess = 0
    let totalFailed = 0
    let totalProcessingTime = 0

    for (const channel in results) {
      const result = results[channel]
      totalSuccess += result.successCount
      totalFailed += result.failureCount
      totalProcessingTime += result.totalProcessingTime
    }

    revalidatePath("/admin")

    return {
      success: true,
      processed: totalSuccess + totalFailed,
      success: totalSuccess,
      failed: totalFailed,
      processingTime: `${totalProcessingTime.toFixed(2)}ms`,
      results,
    }
  } catch (error) {
    console.error("Error processing queue:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function cleanupQueue(daysToKeep = 7) {
  try {
    const count = await notificationQueue.cleanupOldItems(daysToKeep)
    revalidatePath("/admin")
    return {
      success: true,
      cleanup: { count },
    }
  } catch (error) {
    console.error("Error cleaning up queue:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getQueueStats() {
  try {
    const stats = await notificationQueue.getStats()
    return stats
  } catch (error) {
    console.error("Error getting queue stats:", error)
    throw error
  }
}
