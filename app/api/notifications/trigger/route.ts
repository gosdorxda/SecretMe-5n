import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendNewMessageNotification as sendTelegramNotification } from "@/lib/telegram/service"

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

    // Get user data termasuk notifications_enabled
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*, notifications_enabled")
      .eq("id", userId)
      .single()

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
      telegramEnabled: userData.telegram_notifications,
      telegramId: userData.telegram_id,
      notificationsEnabled: userData.notifications_enabled,
    })

    // Periksa apakah notifikasi diaktifkan
    if (!userData.notifications_enabled) {
      console.log("Notifications are disabled for this user")
      return NextResponse.json({
        success: true,
        message: "Notifications are disabled for this user",
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
        channel: "telegram",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (logError) {
      console.error("Error creating notification log:", logError)
      throw new Error(logError.message)
    }

    // Periksa apakah pengguna memiliki Telegram ID dan notifikasi Telegram diaktifkan
    if (!userData.telegram_id || !userData.telegram_notifications) {
      console.log("User does not have Telegram ID or Telegram notifications are disabled")
      await supabase
        .from("notification_logs")
        .update({
          status: "skipped",
          error_message: "Telegram ID not set or notifications disabled",
        })
        .eq("id", notificationLog.id)

      return NextResponse.json({
        success: true,
        message: "Notification skipped: Telegram ID not set or notifications disabled",
      })
    }

    // Generate profile URL
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${userData.username || userData.numeric_id}`
    console.log("Profile URL for notification:", profileUrl)

    // Send Telegram notification
    try {
      console.log("Sending Telegram notification to:", userData.telegram_id)
      const telegramResult = await sendTelegramNotification({
        telegramId: userData.telegram_id,
        name: userData.name,
        messagePreview: message.content,
        profileUrl,
      })
      console.log("Telegram notification result:", telegramResult)

      // Update status to sent
      await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)

      return NextResponse.json({
        success: true,
        message: "Telegram notification sent successfully",
      })
    } catch (error) {
      console.error("Error sending Telegram notification:", error)
      await supabase
        .from("notification_logs")
        .update({ status: "failed", error_message: error.message })
        .eq("id", notificationLog.id)

      return NextResponse.json(
        { success: false, error: error.message || "Failed to send Telegram notification" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error triggering notification:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to trigger notification" },
      { status: 500 },
    )
  }
}
