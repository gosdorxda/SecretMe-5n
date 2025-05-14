import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { invalidateConfigCache } from "@/lib/cache/rate-limit-cache"

export async function POST(request: Request) {
  try {
    const { max_messages_per_day, max_messages_per_hour, block_duration_hours } = await request.json()

    if (
      typeof max_messages_per_day !== "number" ||
      typeof max_messages_per_hour !== "number" ||
      typeof block_duration_hours !== "number"
    ) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const supabase = createClient(cookies())

    // Verifikasi admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("email").eq("id", session.user.id).single()

    const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda
    if (!adminEmails.includes(userData?.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Simpan konfigurasi baru
    const { data, error } = await supabase
      .from("rate_limit_config")
      .insert({
        max_messages_per_day,
        max_messages_per_hour,
        block_duration_hours,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error saving rate limit config:", error)
      return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
    }

    // Invalidate the config cache
    invalidateConfigCache()

    return NextResponse.json({
      success: true,
      message: "Rate limit configuration saved successfully",
      data,
    })
  } catch (error) {
    console.error("Error in save-rate-limit-config:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
