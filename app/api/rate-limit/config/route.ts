import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs" // Import createRouteHandlerClient

export async function GET() {
  try {
    const supabase = createClient()

    // Ambil konfigurasi rate limit dari database
    const { data, error } = await supabase
      .from("rate_limit_config")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching rate limit config:", error)
      return NextResponse.json({ error: "Error fetching rate limit config" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies }) // Use createRouteHandlerClient

  // Cek session dan verifikasi user dengan cara yang lebih aman
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Error getting session:", sessionError)
    return NextResponse.json({ error: "Authentication error" }, { status: 401 })
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verifikasi user dengan getUser() yang lebih aman
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("Error verifying user:", userError)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 })
  }

  // Verifikasi apakah user adalah admin
  const { data: adminData } = await supabase.from("users").select("email").eq("id", user.id).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  if (!adminEmails.includes(adminData?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { maxMessagesPerDay, maxMessagesPerHour, blockDurationHours } = body

    // Validasi input
    if (
      typeof maxMessagesPerDay !== "number" ||
      typeof maxMessagesPerHour !== "number" ||
      typeof blockDurationHours !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    if (maxMessagesPerDay < 1 || maxMessagesPerHour < 1 || blockDurationHours < 1) {
      return NextResponse.json({ error: "Values must be greater than 0" }, { status: 400 })
    }

    // Simpan konfigurasi baru
    const { data, error } = await supabase.from("rate_limit_config").insert({
      max_messages_per_day: maxMessagesPerDay,
      max_messages_per_hour: maxMessagesPerHour,
      block_duration_hours: blockDurationHours,
      updated_by: user.id,
    })

    if (error) {
      console.error("Error updating rate limit config:", error)
      return NextResponse.json({ error: "Error updating rate limit config" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
