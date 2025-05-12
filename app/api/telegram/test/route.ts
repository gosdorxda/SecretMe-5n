import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendTestMessage } from "@/lib/telegram/service"

export async function POST(request: Request) {
  try {
    // Get user session
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Verifikasi user dengan getUser() yang lebih aman
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError2 } = await supabase
      .from("users")
      .select("name, telegram_id")
      .eq("id", session.user.id)
      .single()

    if (userError2 || !userData) {
      throw new Error(userError2?.message || "User not found")
    }

    if (!userData.telegram_id) {
      return NextResponse.json({ success: false, error: "Telegram ID not set" }, { status: 400 })
    }

    // Send test message
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
