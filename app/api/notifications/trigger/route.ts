import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enqueueTelegramNotification } from "@/lib/queue/notification-queue"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, messageId, type } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Ambil data pengguna
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, username, telegram_id, numeric_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Cek preferensi notifikasi pengguna
    const { data: prefData } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Default preferences jika tidak ada
    const preferences = prefData || {
      telegram_enabled: true,
      whatsapp_enabled: true,
      email_enabled: true,
      in_app_enabled: true,
    }

    // Ambil data pesan jika messageId disediakan
    let messageData = null
    if (messageId) {
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .single()

      if (!messageError && message) {
        messageData = message
      } else {
        console.error("Error fetching message data:", messageError)
      }
    }

    // Buat URL profil
    const username = userData.username || userData.numeric_id
    const profileUrl = `https://secretme.site/${username}`

    // Hasil notifikasi
    const result = {
      success: false,
      telegram: false,
      whatsapp: false,
      email: false,
      in_app: false,
    }

    // Kirim notifikasi Telegram jika diaktifkan dan ID Telegram tersedia
    if (preferences.telegram_enabled && userData.telegram_id) {
      try {
        // Siapkan preview pesan
        let messagePreview = ""
        if (messageData && messageData.content) {
          messagePreview =
            messageData.content.length > 50 ? messageData.content.substring(0, 50) + "..." : messageData.content
        }

        // Tambahkan ke antrian notifikasi Telegram
        await enqueueTelegramNotification(userId, {
          telegramId: userData.telegram_id,
          name: userData.name || userData.username || `user_${userData.numeric_id}`,
          messageId: messageId || "",
          messagePreview,
          profileUrl,
        })

        result.telegram = true
        result.success = true
      } catch (error) {
        console.error("Error queueing Telegram notification:", error)
      }
    }

    // TODO: Implementasi untuk WhatsApp, Email, dan In-App

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error triggering notification:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
