import { type NextRequest, NextResponse } from "next/server"
import { NotificationQueue } from "@/lib/queue/notification-queue"

export async function POST(request: NextRequest) {
  // Verifikasi otorisasi
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const daysToKeep = body.daysToKeep || 7

    const queue = NotificationQueue.getInstance()
    const cleanedCount = await queue.cleanupOldItems(daysToKeep)

    return NextResponse.json({
      success: true,
      cleanedCount,
    })
  } catch (error) {
    console.error("Error cleaning up notification queue:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
