import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { sendNewMessageNotification, sendMessageReplyNotification } from "@/lib/fonnte/service"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Cek session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verifikasi user dengan getUser()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error verifying user:", userError)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId, messageId, type } = body

    if (!userId || !messageId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch user details
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("name, phone_number, notification_channel, whatsapp_notifications")
      .eq("id", userId)
      .single()

    if (userDataError || !userData) {
      console.error("Error fetching user data:", userDataError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch message details
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("content, reply")
      .eq("id", messageId)
      .single()

    if (messageError || !message) {
      console.error("Error fetching message:", messageError)
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Log notification
    const { data: notificationLog, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        message_id: messageId,
        notification_type: type,
        channel: userData.notification_channel || "email",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (logError) {
      console.error("Error logging notification:", logError)
      return NextResponse.json({ error: "Failed to log notification" }, { status: 500 })
    }

    // Determine notification channel
    const useWhatsApp =
      userData.notification_channel === "whatsapp" && userData.whatsapp_notifications && userData.phone_number

    try {
      if (useWhatsApp) {
        // Send WhatsApp notification
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://secretme.vercel.app"
        const profileUrl = `${appUrl}/dashboard`

        if (type === "new_message") {
          await sendNewMessageNotification({
            phone: userData.phone_number,
            name: userData.name,
            messagePreview: message.content,
            profileUrl,
          })
        } else if (type === "message_reply") {
          await sendMessageReplyNotification({
            phone: userData.phone_number,
            name: userData.name,
            replyPreview: message.reply || "Pesan Anda telah dibalas",
            messageUrl: profileUrl,
          })
        }

        // Update status menjadi sent jika berhasil
        await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
      } else {
        // Fallback to email notification (existing logic)
        console.log(`Email notification sent to ${user.email} about message ${messageId}`)

        // Update status menjadi sent
        await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
      }
    } catch (sendError: any) {
      console.error("Failed to send notification:", sendError.message)

      // Catat ke tabel notification_logs
      await supabase
        .from("notification_logs")
        .update({
          status: "failed",
          error_message: sendError.message,
        })
        .eq("id", notificationLog.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error processing notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
