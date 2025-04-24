import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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
  const supabase = createRouteHandlerClient({ cookies })

  // Cek session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verifikasi user dengan getUser()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error verifying user:", userError)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  // Verifikasi apakah user adalah admin
  const { data: adminData } = await supabase.from("users").select("email").eq("id", user.id).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  if (!adminEmails.includes(adminData?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const oldSupabase = createClient()

    // Periksa apakah pengguna adalah admin
    const {
      data: { session: oldSession },
    } = await oldSupabase.auth.getSession()

    if (!oldSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Periksa apakah pengguna adalah admin
    const { data: userData } = await oldSupabase.from("users").select("email").eq("id", oldSession.user.id).single()

    // Daftar email admin (dalam implementasi nyata, ini sebaiknya disimpan di database)
    const oldAdminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

    if (!oldAdminEmails.includes(userData?.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

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
