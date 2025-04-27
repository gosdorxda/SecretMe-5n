import { NextResponse } from "next/server"
import { queueProcessor } from "@/lib/queue/queue-processor"
import { notificationQueue } from "@/lib/queue/notification-queue"

export const dynamic = "force-dynamic" // Perbaikan: menggunakan tanda hubung, bukan underscore
export const maxDuration = 60 // Maximum allowed value (60 seconds)

export async function GET(request: Request) {
  try {
    // Tambahkan logging yang lebih detail untuk membantu debugging secret

    // Ubah bagian verifikasi secret menjadi:
    // Verifikasi secret untuk keamanan
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")
    const envSecret = process.env.CRON_SECRET

    if (!envSecret) {
      console.error("CRON_SECRET environment variable is not set")
      return NextResponse.json({ error: "Server configuration error: CRON_SECRET not set" }, { status: 500 })
    }

    if (secret !== envSecret) {
      console.error(
        `Invalid secret for cron job. Provided: "${secret?.substring(0, 3)}..." Expected length: ${envSecret.length}`,
      )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Cron job secret validated successfully")

    console.log("Starting notification queue processing cron job")

    // Proses antrian dengan batch processing
    const batchSize = Number.parseInt(searchParams.get("batchSize") || "10", 10)
    const channels = (searchParams.get("channels") || "telegram").split(",") as Array<
      "telegram" | "whatsapp" | "email" | "in_app"
    >

    const startTime = performance.now()
    const results = await queueProcessor.processQueueWithBatches(batchSize, channels)
    const endTime = performance.now()
    const processingTime = endTime - startTime

    // Hitung total statistik
    let totalSuccess = 0
    let totalFailed = 0

    for (const channel in results) {
      const result = results[channel]
      totalSuccess += result.successCount
      totalFailed += result.failureCount
    }

    // Bersihkan notifikasi lama jika parameter cleanup=true
    let cleanupCount = 0
    if (searchParams.get("cleanup") === "true") {
      const daysToKeep = Number.parseInt(searchParams.get("daysToKeep") || "7", 10)
      cleanupCount = await notificationQueue.cleanupOldItems(daysToKeep)
    }

    // Dapatkan statistik antrian
    const queueStats = await notificationQueue.getStats()

    return NextResponse.json({
      success: true,
      processed: totalSuccess + totalFailed,
      success: totalSuccess,
      failed: totalFailed,
      processingTime: processingTime.toFixed(2) + "ms",
      results,
      cleanup: cleanupCount > 0 ? { count: cleanupCount } : undefined,
      queueStats,
    })
  } catch (error) {
    console.error("Error in notification queue cron job:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
