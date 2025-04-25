import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Verifikasi user admin
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Verifikasi apakah user adalah admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (userError || !userData || !userData.is_admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Ambil data dari request
    const config = await request.json()

    // Simpan konfigurasi ke database
    const { error } = await supabase.from("site_config").upsert(
      {
        type: "payment_gateway_config",
        config: config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "type" },
    )

    if (error) {
      console.error("Error saving payment config:", error)
      return NextResponse.json({ success: false, error: "Failed to save payment configuration" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in save payment config API:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}
