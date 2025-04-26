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

    console.log(`Sending Telegram notification to chat ID: ${chatId}`)
    console.log(`Message content: ${message.substring(0, 100)}...`)

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

    console.log("Telegram message sent successfully:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("Error sending message to Telegram:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

export async function POST(request: Request) {
  try {
    console.log("Notification trigger received")

    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { userId, messageId, type } = body

    console.log("Notification trigger data:", { userId, messageId, type })

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

    console.log("User data for notification:", userData)

    // Jika tipe notifikasi adalah pesan baru
    if (type === "new_message" && messageId) {
      // Verifikasi message_id ada di tabel messages
      const { data: messageExists, error: messageExistsError } = await supabase
        .from("messages")
        .select("id")
        .eq("id", messageId)
        .single()

      if (messageExistsError || !messageExists) {
        console.error("Error: Message ID does not exist:", messageExistsError)
        return NextResponse.json(
          {
            success: false,
            error: "Message ID does not exist in messages table",
            details: messageExistsError,
          },
          { status: 404 },
        )
      }

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
      const profileUrl = `${appUrl}/dashboard`

      // PENTING: Hapus atau perbarui entri notifikasi yang ada dengan status "pending"
      try {
        // Cek apakah ada notifikasi pending untuk pesan ini
        const { data: pendingNotifications } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("message_id", messageId)
          .eq("status", "pending")

        if (pendingNotifications && pendingNotifications.length > 0) {
          console.log(`Found ${pendingNotifications.length} pending notifications for message ${messageId}`)

          // Hapus notifikasi pending
          const { error: deleteError } = await supabase
            .from("notification_logs")
            .delete()
            .in(
              "id",
              pendingNotifications.map((n) => n.id),
            )

          if (deleteError) {
            console.error("Error deleting pending notifications:", deleteError)
          } else {
            console.log("Deleted pending notifications successfully")
          }
        }
      } catch (error) {
        console.error("Error checking/deleting pending notifications:", error)
      }

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
        try {
          const { error: logError } = await supabase.from("notification_logs").insert({
            user_id: userId,
            message_id: messageId,
            notification_type: "new_message",
            channel: "telegram",
            status: result.success ? "sent" : "failed",
            error_message: result.success ? null : result.error || "Unknown error",
            data: { result },
          })

          if (logError) {
            console.error("Error logging notification:", logError)
            return NextResponse.json(
              {
                success: false,
                error: "Failed to log notification: " + logError.message,
                details: logError,
              },
              { status: 500 },
            )
          }
        } catch (logError: any) {
          console.error("Error inserting notification log:", logError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to insert notification log: " + logError.message,
              details: logError,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({ success: true, result })
      } else {
        console.log("No suitable notification channel found for user:", userId)
        console.log("User notification settings:", {
          channel: userData.notification_channel,
          telegram_chat_id: userData.telegram_chat_id,
        })

        // Log notifikasi yang gagal
        try {
          const { error: logError } = await supabase.from("notification_logs").insert({
            user_id: userId,
            message_id: messageId,
            notification_type: "new_message",
            channel: userData.notification_channel || "unknown",
            status: "failed",
            error_message: "No suitable notification channel configured",
            data: {
              notification_channel: userData.notification_channel,
              has_telegram_chat_id: !!userData.telegram_chat_id,
            },
          })

          if (logError) {
            console.error("Error logging notification failure:", logError)
            return NextResponse.json(
              {
                success: false,
                error: "Failed to log notification failure: " + logError.message,
                details: logError,
              },
              { status: 500 },
            )
          }
        } catch (logError: any) {
          console.error("Error inserting notification log:", logError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to insert notification log: " + logError.message,
              details: logError,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: false,
          error: "No suitable notification channel configured",
        })
      }
    } else if (type === "message_reply") {
      // Untuk tipe message_reply, kita hanya log tanpa mengirim notifikasi
      console.log("Received message_reply notification, but notifications for replies are disabled")

      // Verifikasi message_id ada di tabel messages jika disediakan
      if (messageId) {
        const { data: messageExists, error: messageExistsError } = await supabase
          .from("messages")
          .select("id")
          .eq("id", messageId)
          .single()

        if (messageExistsError || !messageExists) {
          console.error("Error: Message ID does not exist:", messageExistsError)
          return NextResponse.json(
            {
              success: false,
              error: "Message ID does not exist in messages table",
              details: messageExistsError,
            },
            { status: 404 },
          )
        }
      }

      try {
        const { error: logError } = await supabase.from("notification_logs").insert({
          user_id: userId,
          message_id: messageId || null, // Gunakan null jika messageId tidak disediakan
          notification_type: "message_reply",
          channel: "none",
          status: "skipped",
          error_message: "Notifications for replies are disabled",
          data: { skipped: true },
        })

        if (logError) {
          console.error("Error logging reply notification skip:", logError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to log reply notification skip: " + logError.message,
              details: logError,
            },
            { status: 500 },
          )
        }
      } catch (logError: any) {
        console.error("Error inserting reply notification log:", logError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to insert reply notification log: " + logError.message,
            details: logError,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        message: "Notifications for replies are disabled",
      })
    } else {
      console.log("Unsupported notification type or missing message ID:", type)
      return NextResponse.json(
        { success: false, error: "Unsupported notification type or missing message ID" },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("Error triggering notification:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// Endpoint untuk testing
export async function GET() {
  return NextResponse.json({ success: true, message: "Notification endpoint is active" })
}
