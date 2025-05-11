import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId } = body

    if (!recipientId) {
      return NextResponse.json({ error: "Missing recipient ID" }, { status: 400 })
    }

    // Dapatkan IP pengirim
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    const supabase = createClient()

    // Dapatkan user yang terautentikasi dengan cara yang aman
    let userId = null
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (!userError && userData.user) {
      userId = userData.user.id
    }

    // Periksa apakah ada data rate limit untuk IP dan penerima ini
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from("message_rate_limits")
      .select("*")
      .eq("ip_address", ip)
      .eq("recipient_id", recipientId)
      .order("last_attempt", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (rateLimitError) {
      console.error("Error checking rate limit:", rateLimitError)
      return NextResponse.json({ error: "Error checking rate limit" }, { status: 500 })
    }

    if (!rateLimitData) {
      // Jika tidak ada data rate limit, buat baru
      await supabase.from("message_rate_limits").insert({
        ip_address: ip,
        user_id: userId,
        recipient_id: recipientId,
        attempt_count: 1,
        first_attempt: new Date().toISOString(),
        last_attempt: new Date().toISOString(),
      })
    } else {
      // Jika sudah ada data rate limit, update
      await supabase
        .from("message_rate_limits")
        .update({
          attempt_count: rateLimitData.attempt_count + 1,
          last_attempt: new Date().toISOString(),
        })
        .eq("id", rateLimitData.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Rate limit report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
