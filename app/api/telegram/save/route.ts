import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { isValidTelegramId } from "@/lib/telegram/config"

export async function POST(request: Request) {
  try {
    const { telegramId, enableNotifications } = await request.json()

    // Validate Telegram ID
    if (!telegramId || !isValidTelegramId(telegramId)) {
      return NextResponse.json({ success: false, error: "Invalid Telegram ID" }, { status: 400 })
    }

    // Get user session
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Update user with Telegram ID and notification preferences
    const { error } = await supabase
      .from("users")
      .update({
        telegram_id: telegramId,
        telegram_notifications: enableNotifications,
        notification_channel: enableNotifications ? "telegram" : "email",
      })
      .eq("id", session.user.id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      success: true,
      message: "Telegram ID saved successfully",
    })
  } catch (error: any) {
    console.error("Error saving Telegram ID:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to save Telegram ID" }, { status: 500 })
  }
}
