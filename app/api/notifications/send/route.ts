import { NextResponse } from "next/server"
import { sendNotification } from "@/lib/notification/notification-service"

export async function POST(request: Request) {
  try {
    const { userId, messageId, type } = await request.json()

    // Validasi input
    if (!userId || !messageId || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Kirim notifikasi menggunakan service
    const result = await sendNotification({ userId, messageId, type })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in notification endpoint:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to send notification" }, { status: 500 })
  }
}
