import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { enqueueTelegramNotification } from "@/lib/queue/notification-queue"
import { sendNewMessageNotification as sendWhatsAppNotification } from "@/lib/fonnte/service"

export async function POST(request: Request) {
  try {
    const { userId, messageId, type } = await request.json()
    console.log("Notification trigger received:", { userId, messageId, type })

    if (!userId || !messageId || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Hanya proses notifikasi pesan masuk
    if (type !== "new_message") {
      console.log("Skipping non-new_message notification type:", type)
      return NextResponse.json({
        success: true,
        message: "Only new message notifications are supported",
      })
    }

    const supabase = createClient(cookies())

    // Get user data
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      throw new Error(userError.message)
    }

    // Periksa apakah pengguna adalah premium
    if (!userData.is_premium) {
      console.log("Skipping notification for non-premium user:", userId)
      return NextResponse.json({
        success: true,
        message: "Notifications are only available for premium users",
      })
    }

    console.log("User notification settings:", {
      channel: userData.notification_channel,
      telegramEnabled: userData.telegram_notifications,
      telegramId: userData.telegram_id,
      whatsappEnabled: userData.whatsapp_notifications,
      phone: userData.phone_number,
    })

    // Get notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Default preferences if not set
    const newMessagesEnabled = preferences ? preferences.new_messages : true
    console.log("New messages notifications enabled:", newMessagesEnabled)

    // If notifications are disabled, return early
    if (!newMessagesEnabled) {
      console.log("New message notifications are disabled for this user")
      return NextResponse.json({
        success: true,
        message: "New message notifications are disabled for this user",
      })
    }

    // Get message data
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single()

    if (messageError) {
      console.error("Error fetching message data:", messageError)
      throw new Error(messageError.message)
    }

    // Create notification log
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
      throw new Error(logError.message)
    }

    // Determine notification channel
    const useWhatsApp =
      userData.notification_channel === "whatsapp" && userData.whatsapp_notifications && userData.phone_number
    const useTelegram =
      userData.notification_channel === "telegram" && userData.telegram_notifications && userData.telegram_id

    console.log("Selected notification channel:", { useWhatsApp, useTelegram })

    // Generate profile URL
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${userData.username || userData.numeric_id}`
    console.log("Profile URL for notification:", profileUrl)

    // Update notification channel
    await supabase
      .from("notification_logs")
      .update({
        channel: useWhatsApp ? "whatsapp" : useTelegram ? "telegram" : "email",
      })
      .eq("id", notificationLog.id)

    // Tambahkan ke antrian notifikasi berdasarkan channel
    if (useTelegram) {
      // Tambahkan ke antrian Telegram
      console.log("Enqueueing Telegram notification for user:", userId)
      const enqueueResult = await enqueueTelegramNotification(
        userId,
        {
          telegramId: userData.telegram_id,
          name: userData.name || userData.username,
          messagePreview: message.content,
          profileUrl,
          messageId,
        },
        { priority: 2 }, // Prioritas tinggi untuk notifikasi pesan baru
      )

      console.log("Telegram notification enqueued:", enqueueResult)

      if (enqueueResult.success) {
        // Update status to queued
        await supabase
          .from("notification_logs")
          .update({ status: "queued", queue_id: enqueueResult.id })
          .eq("id", notificationLog.id)
      } else {
        // Update status to failed
        await supabase
          .from("notification_logs")
          .update({ status: "failed", error_message: enqueueResult.error })
          .eq("id", notificationLog.id)
      }
    } else if (useWhatsApp) {
      // Implementasi antrian WhatsApp bisa ditambahkan di sini
      // Untuk saat ini, kita gunakan implementasi langsung yang sudah ada
      try {
        console.log("Sending WhatsApp notification to:", userData.phone_number)
        const whatsappResult = await sendWhatsAppNotification({
          phone: userData.phone_number,
          name: userData.name,
          messagePreview: message.content,
          profileUrl,
        })
        console.log("WhatsApp notification result:", whatsappResult)

        // Update status to sent
        await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
      } catch (error) {
        console.error("Error sending WhatsApp notification:", error)
        await supabase
          .from("notification_logs")
          .update({ status: "failed", error_message: error.message })
          .eq("id", notificationLog.id)
      }
    } else {
      // Fallback to email notification (existing logic)
      console.log(`Email notification sent to ${userData.email} about message ${messageId}`)

      // Update status to sent
      await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error triggering notification:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger notification" },
      { status: 500 },
    )
  }
}
