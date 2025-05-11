import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendNewMessageNotification as sendTelegramNotification } from "@/lib/telegram/service"

export async function POST(request: Request) {
  try {
    const { userId, messageId, type } = await request.json()
    console.log("Notification request received:", { userId, messageId, type })

    if (!userId || !messageId || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
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

    // Get notification settings
    const { data: settings, error: settingsError } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching notification settings:", settingsError)
      throw new Error(settingsError.message)
    }

    // Jika tidak ada pengaturan atau notifikasi dinonaktifkan, jangan kirim notifikasi
    if (!settings || !settings.enabled) {
      console.log("Notifications are disabled for this user")
      return NextResponse.json({
        success: true,
        message: "Notifications are disabled for this user",
      })
    }

    // Periksa jenis notifikasi
    let shouldSendNotification = false
    if (type === "new_message" && settings.notify_new_messages) {
      shouldSendNotification = true
    } else if (type === "reply" && settings.notify_replies) {
      shouldSendNotification = true
    } else if (type === "system" && settings.notify_system_updates) {
      shouldSendNotification = true
    }

    if (!shouldSendNotification) {
      console.log(`Notification type ${type} is disabled for this user`)
      return NextResponse.json({
        success: true,
        message: `Notification type ${type} is disabled for this user`,
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
        channel: settings.channel_type,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (logError) {
      console.error("Error creating notification log:", logError)
      throw new Error(logError.message)
    }

    // Generate profile URL
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${userData.username || userData.numeric_id}`

    // Send notification based on channel
    if (settings.channel_type === "telegram" && settings.telegram_id) {
      try {
        console.log("Sending Telegram notification to:", settings.telegram_id)
        const telegramResult = await sendTelegramNotification({
          telegramId: settings.telegram_id,
          name: userData.name,
          messagePreview: message.content,
          profileUrl,
        })
        console.log("Telegram notification result:", telegramResult)

        // Update status to sent
        await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
      } catch (error: any) {
        console.error("Error sending Telegram notification:", error)
        await supabase
          .from("notification_logs")
          .update({ status: "failed", error_message: error.message })
          .eq("id", notificationLog.id)
      }
    } else if (settings.channel_type === "email") {
      // Implementasi email notification
      console.log(`Email notification sent to ${userData.email} about message ${messageId}`)

      // Update status to sent
      await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
    } else {
      // Invalid channel configuration
      console.log(`Invalid notification channel configuration for user ${userId}`)
      await supabase
        .from("notification_logs")
        .update({
          status: "failed",
          error_message: "Invalid notification channel configuration",
        })
        .eq("id", notificationLog.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to send notification" }, { status: 500 })
  }
}
