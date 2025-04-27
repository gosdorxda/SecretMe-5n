import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { NotificationQueueItem, QueueStats, NotificationBatch } from "./types"

// Helper function to generate UUID using native crypto API
function generateUUID(): string {
  // In Node.js environment
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback implementation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class NotificationQueue {
  private static instance: NotificationQueue

  private constructor() {}

  public static getInstance(): NotificationQueue {
    if (!NotificationQueue.instance) {
      NotificationQueue.instance = new NotificationQueue()
    }
    return NotificationQueue.instance
  }

  /**
   * Menambahkan notifikasi ke antrian
   */
  public async enqueue({
    user_id,
    message_id,
    notification_type,
    channel,
    payload,
    priority = 1,
    max_retries = 3,
    batch_id,
  }: {
    user_id: string
    message_id?: string
    notification_type: string
    channel: "telegram" | "whatsapp" | "email" | "in_app"
    payload: Record<string, any>
    priority?: number
    max_retries?: number
    batch_id?: string
  }): Promise<string | null> {
    try {
      console.log("Enqueueing notification:", {
        user_id,
        message_id,
        notification_type,
        channel,
        priority,
        max_retries,
        batch_id,
      })
      console.log("Payload:", JSON.stringify(payload, null, 2))

      const supabase = createClient(cookies())

      // Jika batch_id tidak disediakan, buat batch baru
      const notificationBatchId = batch_id || generateUUID()

      // Cek apakah ini bagian dari batch yang ada
      let batchSize = 1
      let batchPosition = 0

      if (batch_id) {
        // Jika ini bagian dari batch yang ada, dapatkan ukuran batch dan posisi
        const { count } = await supabase
          .from("notification_queue")
          .select("*", { count: "exact", head: true })
          .eq("batch_id", batch_id)

        batchSize = (count || 0) + 1
        batchPosition = count || 0
      }

      const { data, error } = await supabase
        .from("notification_queue")
        .insert({
          user_id,
          message_id,
          notification_type,
          channel,
          payload,
          priority,
          max_retries,
          status: "pending",
          batch_id: notificationBatchId,
          batch_size: batchSize,
          batch_position: batchPosition,
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error enqueueing notification:", error)
        return null
      }

      console.log("Notification enqueued with ID:", data.id)
      return data.id
    } catch (error) {
      console.error("Error in enqueue:", error)
      return null
    }
  }

  /**
   * Menambahkan batch notifikasi ke antrian
   */
  public async enqueueBatch(
    notifications: Array<{
      user_id: string
      message_id?: string
      notification_type: string
      channel: "telegram" | "whatsapp" | "email" | "in_app"
      payload: Record<string, any>
      priority?: number
      max_retries?: number
    }>,
  ): Promise<{ batchId: string; count: number } | null> {
    if (notifications.length === 0) {
      return { batchId: "", count: 0 }
    }

    try {
      const batchId = generateUUID()
      const batchSize = notifications.length

      const supabase = createClient(cookies())

      // Persiapkan data batch untuk dimasukkan
      const batchData = notifications.map((notification, index) => ({
        user_id: notification.user_id,
        message_id: notification.message_id,
        notification_type: notification.notification_type,
        channel: notification.channel,
        payload: notification.payload,
        priority: notification.priority || 1,
        max_retries: notification.max_retries || 3,
        status: "pending",
        batch_id: batchId,
        batch_size: batchSize,
        batch_position: index,
      }))

      // Masukkan batch ke database
      const { data, error } = await supabase.from("notification_queue").insert(batchData).select("id")

      if (error) {
        console.error("Error enqueueing notification batch:", error)
        return null
      }

      console.log(`Batch of ${batchData.length} notifications enqueued with batch ID: ${batchId}`)
      return { batchId, count: batchData.length }
    } catch (error) {
      console.error("Error in enqueueBatch:", error)
      return null
    }
  }

  /**
   * Mengambil notifikasi berikutnya dari antrian untuk diproses
   */
  public async dequeue(limit = 10): Promise<NotificationQueueItem[]> {
    try {
      const supabase = createClient(cookies())

      // Ambil notifikasi dengan status pending atau retry yang waktunya sudah tiba
      // Urutkan berdasarkan dynamic_priority (tinggi ke rendah) dan waktu pembuatan (lama ke baru)
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("notification_queue")
        .select("*")
        .or(`status.eq.pending,and(status.eq.retry,next_retry_at.lte.${now})`)
        .order("dynamic_priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(limit)

      if (error) {
        console.error("Error dequeuing notifications:", error)
        return []
      }

      // Update status menjadi processing
      if (data.length > 0) {
        const ids = data.map((item) => item.id)

        const { error: updateError } = await supabase
          .from("notification_queue")
          .update({
            status: "processing",
            last_processed_at: new Date().toISOString(),
          })
          .in("id", ids)

        if (updateError) {
          console.error("Error updating notification status:", updateError)
        }
      }

      return data as NotificationQueueItem[]
    } catch (error) {
      console.error("Error in dequeue:", error)
      return []
    }
  }

  /**
   * Mengambil batch notifikasi dari antrian untuk diproses
   */
  public async dequeueBatch(
    batchSize = 10,
    channel?: "telegram" | "whatsapp" | "email" | "in_app",
  ): Promise<NotificationBatch | null> {
    try {
      const supabase = createClient(cookies())

      // Buat query dasar
      let query = supabase
        .from("notification_queue")
        .select("*")
        .or("status.eq.pending,and(status.eq.retry,next_retry_at.lte." + new Date().toISOString() + ")")
        .order("dynamic_priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(batchSize)

      // Jika channel ditentukan, filter berdasarkan channel
      if (channel) {
        query = query.eq("channel", channel)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error dequeuing batch:", error)
        return null
      }

      if (data.length === 0) {
        return null
      }

      // Buat batch ID baru
      const batchId = generateUUID()
      const items = data as NotificationQueueItem[]
      const batchChannel = channel || items[0].channel

      // Update status menjadi processing dan tetapkan batch ID
      const ids = items.map((item) => item.id)
      const { error: updateError } = await supabase
        .from("notification_queue")
        .update({
          status: "processing",
          last_processed_at: new Date().toISOString(),
        })
        .in("id", ids)

      if (updateError) {
        console.error("Error updating notification status for batch:", updateError)
      }

      return {
        id: batchId,
        items,
        size: items.length,
        channel: batchChannel,
        createdAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error in dequeueBatch:", error)
      return null
    }
  }

  /**
   * Menandai notifikasi sebagai selesai
   */
  public async markAsCompleted(id: string, processingTime?: number): Promise<boolean> {
    try {
      const supabase = createClient(cookies())

      const updateData: any = {
        status: "completed",
      }

      if (processingTime !== undefined) {
        updateData.processing_time = processingTime
      }

      const { error } = await supabase.from("notification_queue").update(updateData).eq("id", id)

      if (error) {
        console.error("Error marking notification as completed:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in markAsCompleted:", error)
      return false
    }
  }

  /**
   * Menandai batch notifikasi sebagai selesai
   */
  public async markBatchAsCompleted(ids: string[], processingTimes?: Record<string, number>): Promise<boolean> {
    if (ids.length === 0) {
      return true
    }

    try {
      const supabase = createClient(cookies())

      // Jika ada processingTimes, update satu per satu
      if (processingTimes && Object.keys(processingTimes).length > 0) {
        for (const id of ids) {
          const updateData: any = {
            status: "completed",
          }

          if (processingTimes[id] !== undefined) {
            updateData.processing_time = processingTimes[id]
          }

          const { error } = await supabase.from("notification_queue").update(updateData).eq("id", id)

          if (error) {
            console.error(`Error marking notification ${id} as completed:`, error)
          }
        }
        return true
      }

      // Jika tidak ada processingTimes, update semua sekaligus
      const { error } = await supabase.from("notification_queue").update({ status: "completed" }).in("id", ids)

      if (error) {
        console.error("Error marking batch as completed:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in markBatchAsCompleted:", error)
      return false
    }
  }

  /**
   * Menandai notifikasi sebagai gagal dan mengatur retry jika perlu
   */
  public async markAsFailed(id: string, errorMessage: string): Promise<boolean> {
    try {
      const supabase = createClient(cookies())

      // Ambil data notifikasi
      const { data, error } = await supabase.from("notification_queue").select("*").eq("id", id).single()

      if (error) {
        console.error("Error getting notification:", error)
        return false
      }

      const notification = data as NotificationQueueItem
      const newRetryCount = notification.retry_count + 1

      // Cek apakah masih bisa retry
      if (newRetryCount <= notification.max_retries) {
        // Hitung waktu retry berikutnya dengan exponential backoff + jitter
        const baseDelay = 30 // 30 detik
        const exponentialPart = Math.pow(2, newRetryCount - 1) * baseDelay
        const jitter = Math.random() * 15 // Random jitter 0-15 detik
        const delayInSeconds = exponentialPart + jitter

        const nextRetryAt = new Date()
        nextRetryAt.setSeconds(nextRetryAt.getSeconds() + delayInSeconds)

        // Update status menjadi retry
        const { error: updateError } = await supabase
          .from("notification_queue")
          .update({
            status: "retry",
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt.toISOString(),
            error_message: errorMessage,
            last_error: errorMessage,
            last_processed_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (updateError) {
          console.error("Error updating notification for retry:", updateError)
          return false
        }
      } else {
        // Sudah mencapai batas retry, tandai sebagai gagal
        const { error: updateError } = await supabase
          .from("notification_queue")
          .update({
            status: "failed",
            error_message: errorMessage,
            last_error: errorMessage,
            last_processed_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (updateError) {
          console.error("Error marking notification as failed:", updateError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Error in markAsFailed:", error)
      return false
    }
  }

  /**
   * Menandai batch notifikasi sebagai gagal
   */
  public async markBatchAsFailed(
    items: Array<{ id: string; errorMessage: string }>,
  ): Promise<{ success: boolean; failedIds: string[] }> {
    if (items.length === 0) {
      return { success: true, failedIds: [] }
    }

    const failedIds: string[] = []

    try {
      for (const item of items) {
        const success = await this.markAsFailed(item.id, item.errorMessage)
        if (!success) {
          failedIds.push(item.id)
        }
      }

      return {
        success: failedIds.length === 0,
        failedIds,
      }
    } catch (error) {
      console.error("Error in markBatchAsFailed:", error)
      return {
        success: false,
        failedIds: items.map((item) => item.id),
      }
    }
  }

  /**
   * Mendapatkan statistik antrian
   */
  public async getStats(): Promise<QueueStats> {
    try {
      const supabase = createClient(cookies())

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

      // Dapatkan jumlah untuk setiap status
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

      return stats
    } catch (error) {
      console.error("Error in getStats:", error)
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retry: 0,
        total: 0,
      }
    }
  }

  /**
   * Mendapatkan statistik batch
   */
  public async getBatchStats(batchId: string): Promise<{
    total: number
    completed: number
    failed: number
    pending: number
    processing: number
    avgProcessingTime: number
  } | null> {
    try {
      const supabase = createClient(cookies())

      // Dapatkan semua item dalam batch
      const { data, error } = await supabase.from("notification_queue").select("*").eq("batch_id", batchId)

      if (error) {
        console.error("Error getting batch stats:", error)
        return null
      }

      if (!data || data.length === 0) {
        return null
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

      return stats
    } catch (error) {
      console.error("Error in getBatchStats:", error)
      return null
    }
  }

  /**
   * Membersihkan antrian yang sudah selesai atau gagal yang lebih lama dari X hari
   */
  public async cleanupOldItems(daysToKeep = 7): Promise<number> {
    try {
      const supabase = createClient(cookies())

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { data, error } = await supabase
        .from("notification_queue")
        .delete()
        .in("status", ["completed", "failed"])
        .lt("updated_at", cutoffDate.toISOString())
        .select("id")

      if (error) {
        console.error("Error cleaning up old notifications:", error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error("Error in cleanupOldItems:", error)
      return 0
    }
  }
}

// Helper function untuk menambahkan notifikasi Telegram ke antrian
export async function enqueueTelegramNotification(
  userId: string,
  payload: {
    telegramId: string
    text: string
    parseMode?: string
    messageId?: string
    name?: string
    messagePreview?: string
    profileUrl?: string
    [key: string]: any
  },
  options: {
    priority?: number
    maxRetries?: number
    batchId?: string
  } = {},
): Promise<string | null> {
  console.log("enqueueTelegramNotification called with userId:", userId)
  console.log("Telegram payload:", JSON.stringify(payload, null, 2))

  const queue = NotificationQueue.getInstance()

  return queue.enqueue({
    user_id: userId,
    message_id: payload.messageId,
    notification_type: "telegram_message",
    channel: "telegram",
    payload,
    priority: options.priority || 2, // Default priority lebih tinggi untuk Telegram
    max_retries: options.maxRetries || 3,
    batch_id: options.batchId,
  })
}

// Helper function untuk menambahkan batch notifikasi Telegram ke antrian
export async function enqueueTelegramBatch(
  notifications: Array<{
    userId: string
    payload: {
      telegramId: string
      text: string
      parseMode?: string
      messageId?: string
      name?: string
      messagePreview?: string
      profileUrl?: string
      [key: string]: any
    }
    priority?: number
    maxRetries?: number
  }>,
): Promise<{ batchId: string; count: number } | null> {
  const queue = NotificationQueue.getInstance()

  const batchItems = notifications.map((notification) => ({
    user_id: notification.userId,
    message_id: notification.payload.messageId,
    notification_type: "telegram_message",
    channel: "telegram" as const,
    payload: notification.payload,
    priority: notification.priority || 2,
    max_retries: notification.maxRetries || 3,
  }))

  return queue.enqueueBatch(batchItems)
}

// Export instance singleton untuk kemudahan penggunaan
export const notificationQueue = NotificationQueue.getInstance()
