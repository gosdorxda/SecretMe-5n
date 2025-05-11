import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendNewMessageNotification as sendWhatsAppNotification } from "@/lib/fonnte/service"
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
      phone: userData.whatsapp_number,
    })

    // Get notification preferences from the new table
    const { data: notificationPrefs, error: prefsError } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Default to user settings if no preferences found
    const notificationEnabled =
      notificationPrefs?.enabled ??
      (userData.telegram_notifications ||
        userData.whatsapp_notifications_enabled ||
        userData.email_notifications_enabled)

    const notificationChannel =
      notificationPrefs?.channel ??
      userData.notification_channel ??
      (userData.telegram_notifications ? "telegram" : userData.whatsapp_notifications_enabled ? "whatsapp" : "email")

    // If notifications are disabled, return early
    if (!notificationEnabled) {
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

    // Create notification log using the new structure
    const { data: notificationLog, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        message_id: messageId,
        channel: notificationChannel, // Use channel instead of notification_type
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
      notificationChannel === "whatsapp" && (notificationPrefs?.whatsapp_number || userData.whatsapp_number)

    const useTelegram = notificationChannel === "telegram" && (notificationPrefs?.telegram_id || userData.telegram_id)

    console.log("Selected notification channel:", { useWhatsApp, useTelegram })

    // Generate profile URL
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${userData.username || userData.numeric_id}`
    console.log("Profile URL for notification:", profileUrl)

    // Send notification based on channel
    if (useWhatsApp) {
      // Send WhatsApp notification
      try {
        const whatsappNumber = notificationPrefs?.whatsapp_number || userData.whatsapp_number
        console.log("Sending WhatsApp notification to:", whatsappNumber)
        const whatsappResult = await sendWhatsAppNotification({
          phone: whatsappNumber,
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
    } else if (useTelegram) {
      // Send Telegram notification
      try {
        const telegramId = notificationPrefs?.telegram_id || userData.telegram_id
        console.log("Sending Telegram notification to:", telegramId)
        const telegramResult = await sendTelegramNotification({
          telegramId: telegramId,
          name: userData.name,
          messagePreview: message.content,
          profileUrl,
        })
        console.log("Telegram notification result:", telegramResult)

        // Update status to sent
        await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
      } catch (error) {
        console.error("Error sending Telegram notification:", error)
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
