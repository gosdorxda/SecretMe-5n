import { type NextRequest, NextResponse } from "next/server"
import { QueueProcessor } from "@/lib/queue/queue-processor"
import { NotificationQueue } from "@/lib/queue/notification-queue"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Verifikasi secret untuk keamanan
    const authHeader = request.headers.get("authorization")
    const expectedSecret = process.env.CRON_SECRET

    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const batchSize = body.batchSize || 10
    const cleanup = body.cleanup || false
    const daysToKeep = body.daysToKeep || 7

    // Proses antrian
    const processor = QueueProcessor.getInstance()
    const processedCount = await processor.processQueue(batchSize)

    // Bersihkan item lama jika diminta
    let cleanedCount = 0
    if (cleanup) {
      const queue = NotificationQueue.getInstance()
      cleanedCount = await queue.cleanupOldItems(daysToKeep)
    }

    return NextResponse.json({
      success: true,
      processedCount,
      cleanedCount,
    })
  } catch (error) {
    console.error("Error processing notification queue:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
