import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

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

    // Get the code from the request body
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 })
    }

    // Check if the code has been used and a telegram_id has been associated
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("telegram_id, telegram_notifications")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ success: false, error: "Failed to fetch user data" }, { status: 500 })
    }

    // Check if the code has been used
    const { data: codeData, error: codeError } = await supabase
      .from("telegram_connection_codes")
      .select("is_used, telegram_id")
      .eq("code", code)
      .eq("user_id", session.user.id)
      .single()

    if (codeError) {
      console.error("Error fetching code data:", codeError)
      return NextResponse.json({ success: false, error: "Failed to fetch code data" }, { status: 500 })
    }

    // If the code is used and we have a telegram_id, connection is successful
    if (codeData?.is_used && userData?.telegram_id) {
      return NextResponse.json({
        success: true,
        connected: true,
        telegramId: userData.telegram_id,
        telegramNotifications: userData.telegram_notifications,
      })
    }

    // Otherwise, still waiting for connection
    return NextResponse.json({
      success: true,
      connected: false,
    })
  } catch (error: any) {
    console.error("Error polling connection status:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to poll connection status" },
      { status: 500 },
    )
  }
}
