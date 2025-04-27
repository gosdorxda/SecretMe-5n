import { type NextRequest, NextResponse } from "next/server"
import { QueueProcessor } from "@/lib/queue/queue-processor"
import { NotificationQueue } from "@/lib/queue/notification-queue"

export async function POST(request: NextRequest) {
  // Verifikasi otorisasi
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const batchSize = body.batchSize || 10
    const useBatchProcessing = body.useBatchProcessing || false
    const maxBatches = body.maxBatches || 5
    const channelConcurrency = body.channelConcurrency || {
      telegram: 2,
      whatsapp: 2,
      email: 3,
      in_app: 5,
    }

    // Cek apakah ini permintaan untuk membersihkan antrian
    if (body.cleanup) {
      const daysToKeep = body.daysToKeep || 7
      const queue = NotificationQueue.getInstance()
      const cleanedCount = await queue.cleanupOldItems(daysToKeep)

      return NextResponse.json({
        success: true,
        cleanedCount,
      })
    }

    // Proses antrian
    const processor = QueueProcessor.getInstance()

    if (useBatchProcessing) {
      // Gunakan batch processing
      const result = await processor.processQueueWithBatches({
        batchSize,
        maxBatches,
        channelConcurrency,
      })

      return NextResponse.json({
        success: true,
        processedCount: result.processedCount,
        batchesProcessed: result.batchesProcessed,
        processingTime: result.processingTime,
        channelStats: result.channelStats,
      })
    } else {
      // Gunakan pemrosesan normal
      const processedCount = await processor.processQueue(batchSize)

      return NextResponse.json({
        success: true,
        processedCount,
      })
    }
  } catch (error) {
    console.error("Error processing notification queue:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
