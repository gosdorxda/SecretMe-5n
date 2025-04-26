import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { TELEGRAM_BOT_TOKEN } from "@/lib/telegram/config"

export async function POST(request: Request) {
  try {
    // Verifikasi admin
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Cek apakah pengguna adalah admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData || !userData.is_admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Dapatkan URL webhook dari request
    const { webhookUrl } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json({ success: false, error: "Webhook URL is required" }, { status: 400 })
    }

    // Set webhook
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        // Dalam produksi, Anda harus mengatur secret token
        // secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to set webhook: ${errorData.description || response.statusText}`)
    }

    const webhookInfo = await response.json()

    return NextResponse.json({
      success: true,
      message: "Webhook set successfully",
      webhookInfo,
    })
  } catch (error: any) {
    console.error("Error setting Telegram webhook:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to set webhook" }, { status: 500 })
  }
}

// Endpoint untuk mendapatkan informasi webhook saat ini
export async function GET(request: Request) {
  try {
    // Verifikasi admin
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Cek apakah pengguna adalah admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()

    if (userError || !userData || !userData.is_admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Dapatkan informasi webhook saat ini
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to get webhook info: ${errorData.description || response.statusText}`)
    }

    const webhookInfo = await response.json()

    return NextResponse.json({
      success: true,
      webhookInfo: webhookInfo.result,
    })
  } catch (error: any) {
    console.error("Error getting Telegram webhook info:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to get webhook info" }, { status: 500 })
  }
}
