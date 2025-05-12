import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { enabled } = await request.json()
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

    // Update telegram_notifications
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_notifications: enabled,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating Telegram notifications:", updateError)
      return NextResponse.json(
        { success: false, error: updateError.message || "Failed to update Telegram notifications" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Telegram notifications ${enabled ? "enabled" : "disabled"} successfully`,
    })
  } catch (error: any) {
    console.error("Error saving Telegram settings:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save Telegram settings" },
      { status: 500 },
    )
  }
}
