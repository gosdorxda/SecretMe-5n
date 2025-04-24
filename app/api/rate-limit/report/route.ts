import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ipAddress, reason, isPermanent = false } = body

    if (!ipAddress) {
      return NextResponse.json({ error: "Missing IP address" }, { status: 400 })
    }

    const supabase = createClient()

    // Periksa apakah IP sudah diblokir
    const { data: existingBlock } = await supabase
      .from("blocked_ips")
      .select("*")
      .eq("ip_address", ipAddress)
      .maybeSingle()

    const blockedUntil = new Date()
    blockedUntil.setHours(blockedUntil.getHours() + 24) // Blokir selama 24 jam

    if (existingBlock) {
      // Update blokir yang sudah ada
      await supabase
        .from("blocked_ips")
        .update({
          reason: reason || existingBlock.reason,
          blocked_at: new Date().toISOString(),
          blocked_until: isPermanent ? null : blockedUntil.toISOString(),
          is_permanent: isPermanent,
        })
        .eq("id", existingBlock.id)
    } else {
      // Buat blokir baru
      await supabase.from("blocked_ips").insert({
        ip_address: ipAddress,
        reason,
        blocked_at: new Date().toISOString(),
        blocked_until: isPermanent ? null : blockedUntil.toISOString(),
        is_permanent: isPermanent,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reporting spam:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
