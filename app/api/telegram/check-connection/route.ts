import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Get user session
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Verifikasi pengguna dengan getUser()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error verifying user:", userError)
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { telegramId } = body

    // Validate telegramId
    if (!telegramId) {
      return NextResponse.json({ success: false, error: "Telegram ID is required" }, { status: 400 })
    }

    // Check if the Telegram ID exists and is valid
    // This is a simple check - you might want to add more validation
    if (telegramId && telegramId.length > 0) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Invalid Telegram ID" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Error checking Telegram connection:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check Telegram connection" },
      { status: 500 },
    )
  }
}
