import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import {
  getCachedRateLimitConfig,
  getCachedRateLimitStatus,
  invalidateRateLimitStatus,
} from "@/lib/cache/rate-limit-cache"

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

    // Ambil konfigurasi rate limit dari cache
    const rateConfig = await getCachedRateLimitConfig(supabase)

    // Gunakan konfigurasi dari cache
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

    // Dapatkan session user jika ada
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    let userId = null

    if (sessionError) {
      console.error("Error getting session:", sessionError)
      // Continue without user ID
    } else if (session) {
      // Verifikasi user dengan getUser() untuk keamanan ekstra
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error verifying user:", userError)
        // Continue without user ID
      } else if (user) {
        userId = user.id
      }
    }

    // Periksa rate limit dari cache terlebih dahulu
    const cachedStatus = await getCachedRateLimitStatus(supabase, ip, recipientId)

    const now = new Date()

    // Jika ada status di cache dan masih valid
    if (cachedStatus) {
      // Jika diblokir dan masa blokir belum berakhir
      if (cachedStatus.is_blocked && cachedStatus.expires_at && new Date(cachedStatus.expires_at) > now) {
        const remainingHours = Math.ceil(
          (new Date(cachedStatus.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60),
        )
        return NextResponse.json(
          {
            allowed: false,
            reason: `Anda telah mencapai batas pengiriman pesan. Coba lagi dalam ${remainingHours} jam.`,
          },
          { status: 429 },
        )
      }

      // Jika diblokir tapi masa blokir sudah berakhir, reset rate limit
      if (cachedStatus.is_blocked) {
        await supabase
          .from("message_rate_limits")
          .update({
            attempt_count: 1,
            first_attempt: now.toISOString(),
            last_attempt: now.toISOString(),
            is_blocked: false,
          })
          .eq("ip_address", ip)
          .eq("recipient_id", recipientId)

        // Invalidasi cache
        invalidateRateLimitStatus(ip, recipientId)

        return NextResponse.json({ allowed: true })
      }

      // Periksa batas per hari
      const oneDayAgo = new Date(now)
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      if (new Date(cachedStatus.first_attempt) > oneDayAgo) {
        // Masih dalam periode 24 jam yang sama
        if (cachedStatus.attempt_count >= RATE_LIMIT.MAX_MESSAGES_PER_DAY) {
          // Blokir jika melebihi batas harian
          await supabase
            .from("message_rate_limits")
            .update({
              last_attempt: now.toISOString(),
              is_blocked: true,
            })
            .eq("ip_address", ip)
            .eq("recipient_id", recipientId)

          // Invalidasi cache
          invalidateRateLimitStatus(ip, recipientId)

          return NextResponse.json(
            {
              allowed: false,
              reason: `Anda telah mencapai batas ${RATE_LIMIT.MAX_MESSAGES_PER_DAY} pesan per hari untuk penerima ini.`,
            },
            { status: 429 },
          )
        }
      }

      // Periksa batas per jam
      const oneHourAgo = new Date(now)
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      if (
        new Date(cachedStatus.last_attempt) > oneHourAgo &&
        cachedStatus.attempt_count >= RATE_LIMIT.MAX_MESSAGES_PER_HOUR
      ) {
        return NextResponse.json(
          {
            allowed: false,
            reason: `Anda telah mencapai batas ${RATE_LIMIT.MAX_MESSAGES_PER_HOUR} pesan per jam untuk penerima ini.`,
          },
          { status: 429 },
        )
      }
    }

    // Jika tidak ada di cache atau cache tidak valid, periksa dari database
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

      // Invalidasi cache
      invalidateRateLimitStatus(ip, recipientId)

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

      // Invalidasi cache
      invalidateRateLimitStatus(ip, recipientId)

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

        // Invalidasi cache
        invalidateRateLimitStatus(ip, recipientId)

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

      // Invalidasi cache
      invalidateRateLimitStatus(ip, recipientId)

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

    // Invalidasi cache
    invalidateRateLimitStatus(ip, recipientId)

    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error("Rate limit check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
