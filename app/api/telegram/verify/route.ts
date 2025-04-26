import { NextResponse } from "next/server"
import { sendVerificationCode } from "@/lib/telegram/service"
import { isValidTelegramId } from "@/lib/telegram/config"

export async function POST(request: Request) {
  try {
    const { telegramId } = await request.json()

    // Validate Telegram ID
    if (!telegramId || !isValidTelegramId(telegramId)) {
      return NextResponse.json({ success: false, error: "Invalid Telegram ID" }, { status: 400 })
    }

    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Send verification code via Telegram
    await sendVerificationCode(telegramId, verificationCode)

    // In a real app, you would store this code in a database with an expiration time
    // and not return it to the client. This is just for demonstration purposes.
    return NextResponse.json({
      success: true,
      message: "Verification code sent",
      verificationCode,
    })
  } catch (error: any) {
    console.error("Error sending verification code:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send verification code" },
      { status: 500 },
    )
  }
}
