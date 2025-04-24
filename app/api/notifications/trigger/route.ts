import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

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

    // Fetch message details
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .select("content, reply")
      .eq("id", messageId)
      .single()

    if (messageError) {
      console.error("Error fetching message:", messageError)
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Log notification
    const { data: notificationLog, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        user_id: user.id, // Use verified user.id
        message_id: messageId,
        notification_type: type,
        channel: "email",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (logError) {
      console.error("Error logging notification:", logError)
      return NextResponse.json({ error: "Failed to log notification" }, { status: 500 })
    }

    try {
      // In a real implementation, you would send an email here
      // For now, we'll just log it
      console.log(`Notification sent to ${user.email} about message ${messageId}`)

      // Update status menjadi sent jika berhasil
      await supabase.from("notification_logs").update({ status: "sent" }).eq("id", notificationLog.id)
    } catch (sendError: any) {
      console.error("Failed to send notification:", sendError.message)

      // Catat ke tabel failed_notification_logs
      await supabase.from("failed_notification_logs").insert({
        notification_log_id: notificationLog.id,
        error_message: sendError.message,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
