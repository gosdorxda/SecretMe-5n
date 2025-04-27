import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  // Verifikasi otorisasi
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { daysToKeep = 7 } = await request.json()

    // Hitung tanggal cutoff
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const supabase = createClient()

    // Hapus item yang sudah selesai atau gagal dan lebih lama dari cutoff date
    const { data, error } = await supabase
      .from("notification_queue")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .in("status", ["completed", "failed"])
      .select("count")

    if (error) {
      console.error("Error cleaning up old queue items:", error)
      return NextResponse.json({ error: "Failed to clean up old items" }, { status: 500 })
    }

    const cleanedCount = data?.length || 0

    return NextResponse.json({ success: true, cleanedCount })
  } catch (error) {
    console.error("Error in cleanup route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
