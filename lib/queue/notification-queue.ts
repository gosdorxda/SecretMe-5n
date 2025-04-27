import { createClient } from "@/lib/supabase/server"
import type { NotificationQueueItem, QueueStats } from "./types"

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
  }: {
    user_id: string
    message_id?: string
    notification_type: string
    channel: "telegram" | "whatsapp" | "email" | "in_app"
    payload: Record<string, any>
    priority?: number
    max_retries?: number
  }): Promise<string | null> {
    try {
      const supabase = createClient()

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
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error enqueueing notification:", error)
        return null
      }

      return data.id
    } catch (error) {
      console.error("Error in enqueue:", error)
      return null
    }
  }

  /**
   * Mengambil notifikasi berikutnya dari antrian untuk diproses
   */
  public async dequeue(limit = 10): Promise<NotificationQueueItem[]> {
    try {
      const supabase = createClient()

      // Ambil notifikasi dengan status pending atau retry yang waktunya sudah tiba
      // Urutkan berdasarkan prioritas (tinggi ke rendah) dan waktu pembuatan (lama ke baru)
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("notification_queue")
        .select("*")
        .or(`status.eq.pending,and(status.eq.retry,next_retry_at.lte.${now})`)
        .order("priority", { ascending: false })
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
          .update({ status: "processing" })
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
   * Menandai notifikasi sebagai selesai
   */
  public async markAsCompleted(id: string): Promise<boolean> {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("notification_queue").update({ status: "completed" }).eq("id", id)

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
   * Menandai notifikasi sebagai gagal dan mengatur retry jika perlu
   */
  public async markAsFailed(id: string, errorMessage: string): Promise<boolean> {
    try {
      const supabase = createClient()

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
   * Mendapatkan statistik antrian
   */
  public async getStats(): Promise<QueueStats> {
    try {
      const supabase = createClient()

      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retry: 0,
        total: 0,
      }

      // Ambil jumlah untuk setiap status
      const { data, error } = await supabase.from("notification_queue").select("status, count").group("status")

      if (error) {
        console.error("Error getting queue stats:", error)
        return stats
      }

      // Hitung total dan per status
      let total = 0

      for (const item of data) {
        const status = item.status as keyof QueueStats
        const count = Number.parseInt(item.count as string)

        if (status in stats) {
          stats[status] = count
          total += count
        }
      }

      stats.total = total

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
   * Membersihkan antrian yang sudah selesai atau gagal yang lebih lama dari X hari
   */
  public async cleanupOldItems(daysToKeep = 7): Promise<number> {
    try {
      const supabase = createClient()

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
    messageId?: string
    chatId: string
    text: string
    parseMode?: string
    [key: string]: any
  },
  options: {
    priority?: number
    maxRetries?: number
  } = {},
): Promise<string | null> {
  const queue = NotificationQueue.getInstance()

  return queue.enqueue({
    user_id: userId,
    message_id: payload.messageId,
    notification_type: "telegram_message",
    channel: "telegram",
    payload,
    priority: options.priority || 2, // Default priority lebih tinggi untuk Telegram
    max_retries: options.maxRetries || 3,
  })
}

// Export instance singleton untuk kemudahan penggunaan
export const notificationQueue = NotificationQueue.getInstance()
