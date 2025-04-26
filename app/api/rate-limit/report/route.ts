import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId } = body

    // Dapatkan IP pengirim
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Jika tidak ada recipientId, gunakan default untuk statistik umum
    const targetId = recipientId || "global"

    const supabase = createClient()

    // Catat penggunaan rate limit
    await supabase.from("rate_limit_usage").insert({
      ip_address: ip,
      recipient_id: targetId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Rate limit report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
