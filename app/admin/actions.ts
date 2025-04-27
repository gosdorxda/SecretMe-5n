"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { QueueStats } from "@/lib/queue/types"

// Fungsi untuk memproses antrian notifikasi
export async function processNotificationQueue(batchSize = 20) {
  try {
    // Panggil API untuk memproses antrian dengan batch processing
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/queue/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({
        batchSize,
        useBatchProcessing: true,
        maxBatches: 5,
        channelConcurrency: {
          telegram: 2,
          whatsapp: 2,
          email: 3,
          in_app: 5,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || "Failed to process queue" }
    }

    const data = await response.json()

    // Revalidasi path admin untuk memperbarui UI
    revalidatePath("/admin")

    return {
      success: true,
      processedCount: data.processedCount || 0,
      batchesProcessed: data.batchesProcessed || 0,
      processingTime: data.processingTime || 0,
      channelStats: data.channelStats || {},
    }
  } catch (error) {
    console.error("Error in processNotificationQueue:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Fungsi untuk membersihkan item antrian yang lama
export async function cleanupOldQueueItems(daysToKeep = 7) {
  try {
    // Panggil API untuk membersihkan antrian
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/queue/cleanup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ daysToKeep }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || "Failed to clean up old items" }
    }

    const data = await response.json()

    // Revalidasi path admin untuk memperbarui UI
    revalidatePath("/admin")

    return {
      success: true,
      cleanedCount: data.cleanedCount || 0,
    }
  } catch (error) {
    console.error("Error in cleanupOldQueueItems:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Fungsi untuk mendapatkan statistik antrian - FIXED VERSION
export async function getQueueStats(): Promise<{ success: boolean; stats?: QueueStats; error?: string }> {
  try {
    const supabase = createClient()

    // Inisialisasi stats dengan nilai default
    const stats: QueueStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      retry: 0,
      total: 0,
      avg_processing_time: 0,
      max_processing_time: 0,
      avg_retry_count: 0,
    }

    // Dapatkan jumlah untuk setiap status secara terpisah
    const statuses = ["pending", "processing", "completed", "failed", "retry"]

    for (const status of statuses) {
      const { count, error } = await supabase
        .from("notification_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", status)

      if (error) {
        console.error(`Error getting count for ${status}:`, error)
        continue
      }

      stats[status as keyof QueueStats] = count || 0
      stats.total += count || 0
    }

    // Dapatkan statistik performa
    const { data: perfData, error: perfError } = await supabase
      .from("notification_queue")
      .select("processing_time, retry_count")
      .not("processing_time", "is", null)

    if (!perfError && perfData && perfData.length > 0) {
      const processingTimes = perfData
        .map((item) => item.processing_time)
        .filter((time): time is number => time !== null && time !== undefined)

      const retryCounts = perfData
        .map((item) => item.retry_count)
        .filter((count): count is number => count !== null && count !== undefined)

      if (processingTimes.length > 0) {
        stats.avg_processing_time = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        stats.max_processing_time = Math.max(...processingTimes)
      }

      if (retryCounts.length > 0) {
        stats.avg_retry_count = retryCounts.reduce((sum, count) => sum + count, 0) / retryCounts.length
      }
    }

    return { success: true, stats }
  } catch (error) {
    console.error("Error in getQueueStats:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Fungsi untuk mendapatkan statistik batch
export async function getBatchStats(batchId: string): Promise<{
  success: boolean
  stats?: {
    total: number
    completed: number
    failed: number
    pending: number
    processing: number
    avgProcessingTime: number
  }
  error?: string
}> {
  try {
    const supabase = createClient()

    // Dapatkan semua item dalam batch
    const { data, error } = await supabase.from("notification_queue").select("*").eq("batch_id", batchId)

    if (error) {
      console.error("Error getting batch stats:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Batch not found",
      }
    }

    const stats = {
      total: data.length,
      completed: data.filter((item) => item.status === "completed").length,
      failed: data.filter((item) => item.status === "failed").length,
      pending: data.filter((item) => item.status === "pending").length,
      processing: data.filter((item) => item.status === "processing").length,
      avgProcessingTime: 0,
    }

    // Hitung rata-rata waktu pemrosesan
    const processingTimes = data
      .map((item) => item.processing_time)
      .filter((time): time is number => time !== null && time !== undefined)

    if (processingTimes.length > 0) {
      stats.avgProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
    }

    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error("Error in getBatchStats:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
