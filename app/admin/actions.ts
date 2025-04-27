"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { QueueStats } from "@/lib/queue/types"

// Fungsi untuk memproses antrian notifikasi
export async function processNotificationQueue(batchSize = 20) {
  try {
    // Panggil API untuk memproses antrian
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/queue/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ batchSize }),
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

    return { success: true, stats }
  } catch (error) {
    console.error("Error in getQueueStats:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
