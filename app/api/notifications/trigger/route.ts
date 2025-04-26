import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Fungsi untuk mengirim notifikasi Telegram langsung
async function sendTelegramNotification(chatId: string, message: string) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not defined")
      return { success: false, error: "TELEGRAM_BOT_TOKEN is not defined" }
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("Error sending message to Telegram:", data)
      return { success: false, error: data.description || "Unknown error" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error sending message to Telegram:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { userId, messageId, type } = body

    console.log("Notification trigger received:", { userId, messageId, type })

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Ambil data user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("User data:", userData)

    // Jika tipe notifikasi adalah pesan baru
    if (type === "new_message" && messageId) {
      // Ambil data pesan
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("content")
        .eq("id", messageId)
        .single()

      if (messageError || !messageData) {
        console.error("Error fetching message data:", messageError)
        return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 })
      }

      console.log("Message data:", messageData)

      // Siapkan preview pesan (batasi ke 50 karakter)
      const messagePreview =
        messageData.content.length > 50 ? messageData.content.substring(0, 50) + "..." : messageData.content

      // Siapkan URL profil
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://secretme.site"
      const profileUrl = `${appUrl}/${userData.username || ""}`

      // Kirim notifikasi berdasarkan channel yang dipilih user
      if (userData.notification_channel === "telegram" && userData.telegram_chat_id) {
        console.log("Sending Telegram notification to:", userData.telegram_chat_id)

        // Buat pesan notifikasi
        const notificationMessage = `
<b>🔔 Pesan Baru di SecretMe!</b>

Hai <b>${userData.name || "Pengguna"}</b>, Anda menerima pesan baru:

"<i>${messagePreview}</i>"

<a href="${profileUrl}">Klik di sini</a> untuk melihat dan membalas pesan.

<i>Bot ini adalah layanan resmi dari SecretMe</i>
        `

        // Kirim notifikasi Telegram langsung
        const result = await sendTelegramNotification(userData.telegram_chat_id, notificationMessage)

        console.log("Telegram notification result:", result)

        // Log notifikasi ke database
        await supabase.from("notification_logs").insert({
          user_id: userId,
          message_id: messageId,
          notification_type: "new_message",
          channel: "telegram",
          status: result.success ? "sent" : "failed",
          error_message: result.success ? null : result.error || "Unknown error",
          data: { result },
        })

        return NextResponse.json({ success: true, result })
      } else {
        console.log("No suitable notification channel found for user:", userId)
        console.log("User data:", userData)

        return NextResponse.json({
          success: false,
          error: "No suitable notification channel configured",
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error triggering notification:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Endpoint untuk testing
export async function GET() {
  return NextResponse.json({ success: true, message: "Notification endpoint is active" })
}
