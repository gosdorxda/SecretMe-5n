import { type NextRequest, NextResponse } from "next/server"
import { QueueProcessor } from "@/lib/queue/queue-processor"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Maksimum 60 detik sesuai batasan Vercel

export async function GET(request: NextRequest) {
  // Verifikasi otorisasi
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const processor = QueueProcessor.getInstance()

    // Gunakan batch processing untuk meningkatkan performa
    const result = await processor.processQueueWithBatches({
      batchSize: 20,
      maxBatches: 5,
      channelConcurrency: {
        telegram: 2,
        whatsapp: 2,
        email: 3,
        in_app: 5,
      },
    })

    return NextResponse.json({
      success: true,
      processedCount: result.processedCount,
      batchesProcessed: result.batchesProcessed,
      processingTime: result.processingTime,
      channelStats: result.channelStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in cron job for processing notification queue:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
