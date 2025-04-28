import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    // Get user session
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has a connected Telegram ID
    const { data: userData, error } = await supabase
      .from("users")
      .select("telegram_id, telegram_notifications")
      .eq("id", session.user.id)
      .single()

    if (error) {
      console.error("Error checking user data:", error)
      return NextResponse.json({ success: false, error: "Failed to check connection status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isConnected: !!userData.telegram_id,
      telegramId: userData.telegram_id,
      telegramNotifications: userData.telegram_notifications || false,
    })
  } catch (error: any) {
    console.error("Error checking connection status:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check connection status" },
      { status: 500 },
    )
  }
}
