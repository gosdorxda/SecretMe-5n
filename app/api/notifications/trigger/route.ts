import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendNewMessageNotification as sendWhatsAppNotification } from "@/lib/fonnte/service"
import { sendNewMessageNotification as sendTelegramNotification } from "@/lib/telegram/service"

export async function POST(request: Request) {
  try {
    const { userId, messageId, type } = await request.json()

    if (!userId || !messageId || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Hanya proses notifikasi pesan masuk
    if (type !== "new_message") {
      return NextResponse.json({
        success: true,
        message: "Only new message notifications are supported",
      })
    }

    const supabase = createClient(cookies())

    // Get user data
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      throw new Error(userError.message)
    }

    // Get notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Default preferences if not set
    const newMessagesEnabled = preferences ? preferences.new_messages : true

    // If notifications are disabled, return early
    if (!newMessagesEnabled) {
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
      throw new Error(logError.message)
    }

    // Determine notification channel
    const useWhatsApp =
      userData.notification_channel === "whatsapp" && userData.whatsapp_notifications && userData.phone_number
    const useTelegram =
      userData.notification_channel === "telegram" && userData.telegram_notifications && userData.telegram_id

    // Generate profile URL
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${userData.username || userData.numeric_id}`

    // Update notification channel
    await supabase
      .from("notification_logs")
      .update({
        channel: useWhatsApp ? "whatsapp" : useTelegram ? "telegram" : "email",
      })
      .eq("id", notificationLog.id)

    // Send notification based on channel
    if (useWhatsApp) {
      // Send WhatsApp notification
      try {
        await sendWhatsAppNotification({
          phone: userData.phone_number,
          name: userData.name,
          messagePreview: message.content,
          profileUrl,
        })

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
        await sendTelegramNotification({
          telegramId: userData.telegram_id,
          name: userData.name,
          messagePreview: message.content,
          profileUrl,
        })

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
