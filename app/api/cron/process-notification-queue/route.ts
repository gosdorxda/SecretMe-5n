import { type NextRequest, NextResponse } from "next/server"
import { QueueProcessor } from "@/lib/queue/queue-processor"
import { NotificationQueue } from "@/lib/queue/notification-queue"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Verifikasi secret untuk keamanan
    const authHeader = request.headers.get("authorization")
    const expectedSecret = process.env.CRON_SECRET

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Proses antrian dengan batch size default (10)
    const processor = QueueProcessor.getInstance()
    const processedCount = await processor.processQueue()

    // Bersihkan item yang sudah selesai atau gagal yang lebih lama dari 7 hari
    // Hanya dilakukan setiap 24 jam (berdasarkan probabilitas 1/24)
    let cleanedCount = 0
    if (Math.random() < 1 / 24) {
      const queue = NotificationQueue.getInstance()
      cleanedCount = await queue.cleanupOldItems(7)
    }

    return NextResponse.json({
      success: true,
      processedCount,
      cleanedCount,
    })
  } catch (error) {
    console.error("Error in cron job for processing notification queue:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
