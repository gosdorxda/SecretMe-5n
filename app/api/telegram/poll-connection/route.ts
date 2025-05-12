import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Support untuk metode GET
export async function GET(request: Request) {
  return handlePollConnection(request)
}

// Support untuk metode POST
export async function POST(request: Request) {
  return handlePollConnection(request)
}

// Fungsi umum untuk menangani polling koneksi
async function handlePollConnection(request: Request) {
  try {
    const supabase = createClient(cookies())

    let code: string | null = null

    // Coba dapatkan kode dari URL query string (untuk GET request)
    const url = new URL(request.url)
    code = url.searchParams.get("code")

    // Jika tidak ada di query string, coba dapatkan dari body (untuk POST request)
    if (!code && request.headers.get("content-type")?.includes("application/json")) {
      try {
        const body = await request.json()
        code = body.code
      } catch (error) {
        console.error("Error parsing JSON body:", error)
      }
    }

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 })
    }

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

    // Cek status kode koneksi
    const { data: codeData, error: codeError } = await supabase
      .from("telegram_connection_codes")
      .select("is_used, expires_at")
      .eq("code", code)
      .eq("user_id", user.id)
      .single()

    if (codeError) {
      console.error("Error fetching code data:", codeError)
      return NextResponse.json(
        { success: false, error: codeError.message || "Failed to fetch code data" },
        { status: 500 },
      )
    }

    // Cek apakah kode sudah digunakan
    if (codeData.is_used) {
      // Cek apakah user memiliki telegram_id
      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("telegram_id, telegram_notifications")
        .eq("id", user.id)
        .single()

      if (userDataError) {
        console.error("Error fetching user data:", userDataError)
        return NextResponse.json(
          { success: false, error: userDataError.message || "Failed to fetch user data" },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        connected: !!userData.telegram_id,
        telegramId: userData.telegram_id,
        telegramNotificationsEnabled: userData.telegram_notifications || false,
      })
    }

    // Cek apakah kode sudah kadaluwarsa
    const now = new Date()
    const expiresAt = new Date(codeData.expires_at)

    if (now > expiresAt) {
      return NextResponse.json({
        success: false,
        expired: true,
        error: "Code has expired",
      })
    }

    return NextResponse.json({
      success: true,
      connected: false,
      pending: true,
    })
  } catch (error: any) {
    console.error("Error polling connection:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to poll connection" }, { status: 500 })
  }
}
