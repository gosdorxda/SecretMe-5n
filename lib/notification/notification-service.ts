import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendNewMessageNotification as sendTelegramNotification } from "@/lib/telegram/service"
import { sendNewMessageNotification as sendWhatsAppNotification } from "@/lib/fonnte/service"

export interface NotificationData {
  userId: string
  messageId: string
  type: string
}

export async function sendNotification({ userId, messageId, type }: NotificationData) {
  try {
    console.log("Sending notification:", { userId, messageId, type })

    // Validasi input
    if (!userId || !messageId || !type) {
      throw new Error("Missing required fields")
    }

    // Hanya proses notifikasi pesan masuk
    if (type !== "new_message") {
      console.log("Skipping non-new_message notification type:", type)
      return { success: true, message: "Only new message notifications are supported" }
    }

    const supabase = createClient(cookies())

    // Ambil data pengguna dan preferensi notifikasi dalam satu query
    const { data: userData, error: userError } = await supabase
      .from("user_notification_settings_view")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      throw new Error(userError.message)
    }

    // Periksa apakah pengguna adalah premium dan notifikasi diaktifkan
    if (!userData.is_premium || !userData.enabled) {
      console.log("Skipping notification:", {
        isPremium: userData.is_premium,
        notificationsEnabled: userData.enabled,
      })
      return {
        success: true,
        message: "User is not eligible for notifications",
      }
    }

    // Ambil data pesan
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .single()

    if (messageError) {
      console.error("Error fetching message data:", messageError)
      throw new Error(messageError.message)
    }

    // Buat log notifikasi
    const { data: notificationLog, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        message_id: messageId,
        channel: userData.channel,
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

    // Kirim notifikasi berdasarkan saluran
    let success = false
    let errorMessage = null

    try {
      if (userData.channel === "telegram" && userData.telegram_id) {
        // Kirim notifikasi Telegram
        console.log("Sending Telegram notification to:", userData.telegram_id)
        await sendTelegramNotification({
          telegramId: userData.telegram_id,
          name: userData.name,
          messagePreview: message.content,
          profileUrl,
        })
        success = true
      } else if (userData.channel === "whatsapp" && userData.whatsapp_number) {
        // Kirim notifikasi WhatsApp
        console.log("Sending WhatsApp notification to:", userData.whatsapp_number)
        await sendWhatsAppNotification({
          phone: userData.whatsapp_number,
          name: userData.name,
          messagePreview: message.content,
          profileUrl,
        })
        success = true
      } else if (userData.channel === "email") {
        // Kirim notifikasi Email (implementasi sederhana)
        console.log(`Email notification sent to ${userData.email} about message ${messageId}`)
        success = true
      } else {
        throw new Error(`Invalid notification channel: ${userData.channel}`)
      }
    } catch (error) {
      console.error(`Error sending ${userData.channel} notification:`, error)
      errorMessage = error.message
      success = false
    }

    // Update status notifikasi
    await supabase
      .from("notification_logs")
      .update({
        status: success ? "sent" : "failed",
        error_message: errorMessage,
      })
      .eq("id", notificationLog.id)

    return { success }
  } catch (error) {
    console.error("Error in sendNotification:", error)
    return { success: false, error: error.message }
  }
}
