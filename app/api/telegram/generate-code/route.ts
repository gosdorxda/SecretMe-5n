import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createClient(cookies())

    // Gunakan getUser() untuk autentikasi yang lebih aman
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error verifying user:", userError)
      return NextResponse.json(
        { success: false, error: userError?.message || "User verification failed" },
        { status: 401 },
      )
    }

    // Generate kode 6 digit
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Set waktu kedaluwarsa (15 menit dari sekarang)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Simpan kode ke database
    const { data, error } = await supabase
      .from("telegram_connection_codes")
      .insert({
        user_id: user.id,
        code,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error generating code:", error)
      return NextResponse.json({ success: false, error: error.message || "Failed to generate code" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      code,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error generating code:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to generate code" }, { status: 500 })
  }
}
