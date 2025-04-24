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
    await supabase.from("notification_logs").insert({
      user_id: user.id, // Use verified user.id
      message_id: messageId,
      notification_type: type,
      channel: "email",
      status: "sent",
      created_at: new Date().toISOString(),
    })

    // In a real implementation, you would send an email here
    // For now, we'll just log it
    console.log(`Notification sent to ${user.email} about message ${messageId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
