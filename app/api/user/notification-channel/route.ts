import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verifikasi session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Ambil data dari request
    const { channel } = await request.json()

    if (!channel) {
      return NextResponse.json({ success: false, error: "Channel is required" }, { status: 400 })
    }

    // Validasi channel
    if (!["email", "telegram", "whatsapp"].includes(channel)) {
      return NextResponse.json({ success: false, error: "Invalid channel" }, { status: 400 })
    }

    // Update notification_channel
    const { error } = await supabase.from("users").update({ notification_channel: channel }).eq("id", session.user.id)

    if (error) {
      console.error("Error updating notification channel:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in notification channel endpoint:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verifikasi session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Ambil notification_channel
    const { data, error } = await supabase
      .from("users")
      .select("notification_channel, telegram_chat_id, whatsapp_notifications")
      .eq("id", session.user.id)
      .single()

    if (error) {
      console.error("Error fetching notification channel:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      channel: data.notification_channel,
      telegram_connected: !!data.telegram_chat_id,
      whatsapp_enabled: !!data.whatsapp_notifications,
    })
  } catch (error: any) {
    console.error("Error in notification channel endpoint:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
