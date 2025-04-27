import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendDisconnectionMessage } from "@/lib/telegram/service"

export async function POST(request: Request) {
  try {
    const supabase = createClient(cookies())

    // Dapatkan session pengguna
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Dapatkan Telegram ID pengguna sebelum diputuskan
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("id", userId)
      .single()

    if (fetchError || !userData?.telegram_id) {
      return NextResponse.json({ success: false, error: "Telegram ID not found" }, { status: 404 })
    }

    const telegramId = userData.telegram_id

    // Update user untuk menghapus Telegram ID
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_id: null,
        telegram_notifications: false,
        notification_channel: null,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error disconnecting Telegram account:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    // Kirim notifikasi ke pengguna Telegram bahwa koneksi telah diputus
    try {
      await sendDisconnectionMessage(telegramId)
    } catch (error) {
      console.error("Error sending disconnection message:", error)
      // Lanjutkan meskipun gagal mengirim pesan
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error disconnecting Telegram:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect Telegram" },
      { status: 500 },
    )
  }
}
