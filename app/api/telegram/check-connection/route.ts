import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
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

    // Cek apakah user memiliki telegram_id
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("telegram_id, telegram_notifications")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching user data:", fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message || "Failed to fetch user data" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      connected: !!userData.telegram_id,
      telegramNotificationsEnabled: userData.telegram_notifications || false,
    })
  } catch (error: any) {
    console.error("Error checking connection:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to check connection" }, { status: 500 })
  }
}
