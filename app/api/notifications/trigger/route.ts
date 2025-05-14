import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendNewMessageNotification as sendTelegramNotification } from "@/lib/telegram/service"
import { getCachedUser } from "@/lib/cache/user-cache"

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

    // Get user data from cache first
    const userData = await getCachedUser(supabase, userId)

    if (!userData) {
      console.error("Error fetching user data from cache, falling back to database")
      // Fallback to database if not in cache
      const { data: dbUserData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        throw new Error(userError.message)
      }

      // Use database data
      if (!dbUserData.is_premium) {
        console.log("Skipping notification for non-premium user:", userId)
        return NextResponse.json({
          success: true,
          message: "Notifications are only available for premium users",
        })
      }

      console.log("User notification settings:", {
        telegramEnabled: dbUserData.telegram_notifications,
        telegramId: dbUserData.telegram_id,
      })

      // Periksa apakah notifikasi Telegram diaktifkan dan pengguna memiliki Telegram ID
      if (!dbUserData.telegram_notifications || !dbUserData.telegram_id) {
        const reason = !dbUserData.telegram_notifications
          ? "Telegram notifications are disabled for this user"
          : "User does not have Telegram ID"

        console.log(reason)
        return NextResponse.json({
          success: true,
          message: reason,
        })
      }
    } else {
      // Use cached data
      // Periksa apakah pengguna adalah premium
      if (!userData.is_premium) {
        console.log("Skipping notification for non-premium user:", userId)
        return NextResponse.json({
          success: true,
          message: "Notifications are only available for premium users",
        })
      }

      console.log("User notification settings (from cache):", {
        telegramEnabled: userData.telegram_notifications,
        telegramId: userData.telegram_id,
      })

      // Periksa apakah notifikasi Telegram diaktifkan dan pengguna memiliki Telegram ID
      if (!userData.telegram_notifications || !userData.telegram_id) {
        const reason = !userData.telegram_notifications
          ? "Telegram notifications are disabled for this user"
          : "User does not have Telegram ID"

        console.log(reason)
        return NextResponse.json({
          success: true,
          message: reason,
        })
      }
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

    // Use user data from cache or database
    const user = userData || (await getCachedUser(supabase, userId))

    // Generate profile URL
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username || user.numeric_id}`
    console.log("Profile URL for notification:", profileUrl)

    // Send Telegram notification
    try {
      console.log("Sending Telegram notification to:", user.telegram_id)
      const telegramResult = await sendTelegramNotification({
        telegramId: user.telegram_id,
        name: user.name,
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
