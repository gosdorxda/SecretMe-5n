import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendTestMessage } from "@/lib/telegram/service"

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

    // Cek apakah user memiliki telegram_id
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("telegram_id, name")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching user data:", fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message || "Failed to fetch user data" },
        { status: 500 },
      )
    }

    if (!userData.telegram_id) {
      return NextResponse.json(
        { success: false, error: "User does not have a connected Telegram account" },
        { status: 400 },
      )
    }

    // Kirim pesan test
    await sendTestMessage(userData.telegram_id, userData.name)

    return NextResponse.json({
      success: true,
      message: "Test message sent successfully",
    })
  } catch (error: any) {
    console.error("Error sending test message:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to send test message" }, { status: 500 })
  }
}
