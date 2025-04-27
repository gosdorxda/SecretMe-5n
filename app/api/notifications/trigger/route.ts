import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { enqueueTelegramNotification } from "@/lib/queue/notification-queue"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, messageId, type } = body

    console.log("Notification trigger received:", { userId, messageId, type })

    if (!userId) {
      console.error("Missing userId in notification trigger request")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient(cookies())

    // Ambil data pengguna
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, username, telegram_id, numeric_id, is_premium, telegram_notifications, notification_channel")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("User data retrieved:", {
      name: userData.name,
      username: userData.username,
      isPremium: userData.is_premium,
      telegramId: userData.telegram_id,
      telegramNotifications: userData.telegram_notifications,
      notificationChannel: userData.notification_channel,
    })

    // Periksa apakah pengguna adalah premium
    if (!userData.is_premium) {
      console.log("Skipping notification for non-premium user:", userId)
      return NextResponse.json({
        success: true,
        message: "Notifications are only available for premium users",
      })
    }

    // Cek preferensi notifikasi pengguna
    const { data: prefData } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Default preferences jika tidak ada
    const preferences = prefData || {
      new_messages: true,
      message_replies: true,
      system_updates: true,
    }

    console.log("Notification preferences:", preferences)

    // Jika notifikasi pesan baru dinonaktifkan, return early
    if (type === "new_message" && !preferences.new_messages) {
      console.log("New message notifications are disabled for this user")
      return NextResponse.json({
        success: true,
        message: "New message notifications are disabled for this user",
      })
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
        console.log("Message data retrieved:", { id: message.id, contentLength: message.content?.length || 0 })
      } else {
        console.error("Error fetching message data:", messageError)
      }
    }

    // Buat URL profil
    const username = userData.username || userData.numeric_id
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${username}`
    console.log("Profile URL for notification:", profileUrl)

    // Buat log notifikasi
    const { data: notificationLog, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        message_id: messageId,
        notification_type: type,
        channel: "pending",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (logError) {
      console.error("Error creating notification log:", logError)
      // Continue anyway, don't return error
    } else {
      console.log("Notification log created:", notificationLog.id)
    }

    // Hasil notifikasi
    const result = {
      success: false,
      telegram: false,
      whatsapp: false,
      email: false,
      in_app: false,
      logId: notificationLog?.id,
    }

    // Determine notification channel
    const useTelegram =
      (userData.notification_channel === "telegram" || !userData.notification_channel) &&
      userData.telegram_notifications !== false &&
      userData.telegram_id

    console.log("Should use Telegram?", useTelegram, "Telegram ID:", userData.telegram_id)

    // Kirim notifikasi Telegram jika diaktifkan dan ID Telegram tersedia
    if (useTelegram) {
      try {
        // Siapkan preview pesan
        let messagePreview = ""
        if (messageData && messageData.content) {
          messagePreview =
            messageData.content.length > 50 ? messageData.content.substring(0, 50) + "..." : messageData.content
        }

        console.log("Preparing Telegram notification with preview:", messagePreview)

        // Buat teks pesan
        const messageText = `🔔 *Pesan Baru*\n\nHalo ${userData.name || userData.username || `user_${userData.numeric_id}`}, Anda menerima pesan baru di SecretMe!\n\n📝 Pesan: "${messagePreview}"\n\n🔗 [Lihat Pesan](${profileUrl})`

        // Tambahkan ke antrian notifikasi Telegram
        const queueId = await enqueueTelegramNotification(userId, {
          telegramId: userData.telegram_id,
          text: messageText,
          parseMode: "Markdown",
          messageId: messageId || "",
          name: userData.name || userData.username || `user_${userData.numeric_id}`,
          messagePreview,
          profileUrl,
        })

        console.log("Telegram notification enqueued with ID:", queueId)

        if (queueId) {
          result.telegram = true
          result.success = true

          // Update notification log
          if (notificationLog) {
            await supabase
              .from("notification_logs")
              .update({
                channel: "telegram",
                status: "queued",
                data: { queue_id: queueId },
              })
              .eq("id", notificationLog.id)
          }
        } else {
          console.error("Failed to enqueue Telegram notification")

          // Update notification log
          if (notificationLog) {
            await supabase
              .from("notification_logs")
              .update({
                channel: "telegram",
                status: "failed",
                error_message: "Failed to enqueue notification",
              })
              .eq("id", notificationLog.id)
          }
        }
      } catch (error) {
        console.error("Error queueing Telegram notification:", error)

        // Update notification log
        if (notificationLog) {
          await supabase
            .from("notification_logs")
            .update({
              channel: "telegram",
              status: "failed",
              error_message: error instanceof Error ? error.message : "Unknown error",
            })
            .eq("id", notificationLog.id)
        }
      }
    } else {
      console.log("Telegram notifications not enabled or no Telegram ID available")

      // Update notification log
      if (notificationLog) {
        await supabase
          .from("notification_logs")
          .update({
            channel: "none",
            status: "skipped",
            error_message: "Telegram notifications not enabled or no Telegram ID available",
          })
          .eq("id", notificationLog.id)
      }
    }

    // TODO: Implementasi untuk WhatsApp, Email, dan In-App

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error triggering notification:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
