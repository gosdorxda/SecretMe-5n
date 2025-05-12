import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendDisconnectionMessage } from "@/lib/telegram/service"

export async function POST(request: Request) {
  try {
    const supabase = createClient(cookies())

    // Gunakan getUser() untuk autentikasi yang lebih aman
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error verifying user:", userError)
      return NextResponse.json(
        { success: false, error: userError?.message || "User verification failed" },
        { status: 401 },
      )
    }

    // Cek apakah user memiliki telegram_id
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching user data:", fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message || "Failed to fetch user data" },
        { status: 500 },
      )
    }

    if (!userData.telegram_id) {
      return NextResponse.json(
        { success: false, error: "User does not have a connected Telegram account" },
        { status: 400 },
      )
    }

    // Simpan telegram_id untuk mengirim pesan disconnection
    const telegramId = userData.telegram_id

    // Update user untuk menghapus telegram_id
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_id: null,
        telegram_notifications: false,
        notification_channel: null,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error disconnecting Telegram:", updateError)
      return NextResponse.json(
        { success: false, error: updateError.message || "Failed to disconnect Telegram" },
        { status: 500 },
      )
    }

    // Kirim pesan disconnection
    await sendDisconnectionMessage(telegramId)

    return NextResponse.json({
      success: true,
      message: "Telegram disconnected successfully",
    })
  } catch (error: any) {
    console.error("Error disconnecting Telegram:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect Telegram" },
      { status: 500 },
    )
  }
}
