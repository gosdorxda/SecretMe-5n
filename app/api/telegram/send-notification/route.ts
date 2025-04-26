import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { sendTelegramMessage } from "@/lib/telegram/service"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Cek session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, message } = body

    if (!userId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch user details
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("telegram_chat_id")
      .eq("id", userId)
      .single()

    if (userDataError || !userData) {
      console.error("Error fetching user data:", userDataError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!userData.telegram_chat_id) {
      return NextResponse.json({ error: "User has no Telegram chat ID" }, { status: 400 })
    }

    // Send message
    const result = await sendTelegramMessage({
      chatId: userData.telegram_chat_id,
      message,
      parseMode: "HTML",
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending Telegram notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
