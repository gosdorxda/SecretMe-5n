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

    // Ambil konfigurasi rate limit dari database
    const { data: rateConfig, error: configError } = await supabase
      .from("rate_limit_config")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (configError) {
      console.error("Error fetching rate limit config:", configError)
      return NextResponse.json({ error: "Error fetching rate limit config" }, { status: 500 })
    }

    // Gunakan konfigurasi dari database
    const RATE_LIMIT = {
      MAX_MESSAGES_PER_DAY: rateConfig.max_messages_per_day,
      MAX_MESSAGES_PER_HOUR: rateConfig.max_messages_per_hour,
      BLOCK_DURATION_HOURS: rateConfig.block_duration_hours,
    }

    // Periksa apakah IP diblokir secara permanen
    const { data: blockedIp } = await supabase.from("blocked_ips").select("*").eq("ip_address", ip).maybeSingle()

    if (blockedIp) {
      // Jika IP diblokir secara permanen
      if (blockedIp.is_permanent) {
        return NextResponse.json(
          {
            allowed: false,
            reason: "IP Anda telah diblokir secara permanen karena aktivitas mencurigakan.",
          },
          { status: 403 },
        )
      }

      // Jika IP diblokir sementara, periksa apakah masa blokir sudah berakhir
      if (blockedIp.blocked_until && new Date(blockedIp.blocked_until) > new Date()) {
        const remainingTime = Math.ceil(
          (new Date(blockedIp.blocked_until).getTime() - new Date().getTime()) / (1000 * 60 * 60),
        )
        return NextResponse.json(
          {
            allowed: false,
            reason: `IP Anda diblokir sementara. Coba lagi dalam ${remainingTime} jam.`,
          },
          { status: 403 },
        )
      }

      // Jika masa blokir sudah berakhir, hapus dari daftar blokir
      await supabase.from("blocked_ips").delete().eq("id", blockedIp.id)
    }

    // Dapatkan user yang terautentikasi dengan cara yang aman
    let userId = null
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (!userError && userData.user) {
      userId = userData.user.id
    }

    // Periksa rate limit berdasarkan IP dan penerima
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

    const now = new Date()

    // Jika tidak ada data rate limit sebelumnya, buat baru
    if (!rateLimitData) {
      await supabase.from("message_rate_limits").insert({
        ip_address: ip,
        user_id: userId,
        recipient_id: recipientId,
        attempt_count: 1,
        first_attempt: now.toISOString(),
        last_attempt: now.toISOString(),
      })

      return NextResponse.json({ allowed: true })
    }

    // Jika sudah diblokir, periksa apakah masa blokir sudah berakhir
    if (rateLimitData.is_blocked) {
      const blockEndTime = new Date(rateLimitData.last_attempt)
      blockEndTime.setHours(blockEndTime.getHours() + RATE_LIMIT.BLOCK_DURATION_HOURS)

      if (now < blockEndTime) {
        const remainingHours = Math.ceil((blockEndTime.getTime() - now.getTime()) / (1000 * 60 * 60))
        return NextResponse.json(
          {
            allowed: false,
            reason: `Anda telah mencapai batas pengiriman pesan. Coba lagi dalam ${remainingHours} jam.`,
          },
          { status: 429 },
        )
      }

      // Reset rate limit jika masa blokir sudah berakhir
      await supabase
        .from("message_rate_limits")
        .update({
          attempt_count: 1,
          first_attempt: now.toISOString(),
          last_attempt: now.toISOString(),
          is_blocked: false,
        })
        .eq("id", rateLimitData.id)

      return NextResponse.json({ allowed: true })
    }

    // Periksa batas per hari
    const oneDayAgo = new Date(now)
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    if (new Date(rateLimitData.first_attempt) > oneDayAgo) {
      // Masih dalam periode 24 jam yang sama
      if (rateLimitData.attempt_count >= RATE_LIMIT.MAX_MESSAGES_PER_DAY) {
        // Blokir jika melebihi batas harian
        await supabase
          .from("message_rate_limits")
          .update({
            last_attempt: now.toISOString(),
            is_blocked: true,
          })
          .eq("id", rateLimitData.id)

        return NextResponse.json(
          {
            allowed: false,
            reason: `Anda telah mencapai batas ${RATE_LIMIT.MAX_MESSAGES_PER_DAY} pesan per hari untuk penerima ini.`,
          },
          { status: 429 },
        )
      }
    } else {
      // Reset counter jika sudah lebih dari 24 jam
      await supabase
        .from("message_rate_limits")
        .update({
          attempt_count: 1,
          first_attempt: now.toISOString(),
          last_attempt: now.toISOString(),
        })
        .eq("id", rateLimitData.id)

      return NextResponse.json({ allowed: true })
    }

    // Periksa batas per jam
    const oneHourAgo = new Date(now)
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    if (
      new Date(rateLimitData.last_attempt) > oneHourAgo &&
      rateLimitData.attempt_count >= RATE_LIMIT.MAX_MESSAGES_PER_HOUR
    ) {
      return NextResponse.json(
        {
          allowed: false,
          reason: `Anda telah mencapai batas ${RATE_LIMIT.MAX_MESSAGES_PER_HOUR} pesan per jam untuk penerima ini.`,
        },
        { status: 429 },
      )
    }

    // Update attempt counter
    await supabase
      .from("message_rate_limits")
      .update({
        attempt_count: rateLimitData.attempt_count + 1,
        last_attempt: now.toISOString(),
      })
      .eq("id", rateLimitData.id)

    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error("Rate limit check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
