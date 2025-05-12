import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendConnectionSuccessMessage, sendHelpMessage } from "@/lib/telegram/service"

export async function POST(request: Request) {
  try {
    const supabase = createClient(cookies())
    const update = await request.json()

    // Periksa apakah ini adalah pesan
    if (!update.message) {
      return NextResponse.json({ success: true })
    }

    const { message } = update
    const chatId = message.chat.id.toString()
    const text = message.text || ""

    // Periksa apakah ini adalah perintah /start atau /help
    if (text === "/start") {
      await sendHelpMessage(chatId)
      return NextResponse.json({ success: true })
    }

    if (text === "/help") {
      await sendHelpMessage(chatId)
      return NextResponse.json({ success: true })
    }

    // Periksa apakah ini adalah kode koneksi (6 digit)
    const codeRegex = /^\d{6}$/
    if (codeRegex.test(text)) {
      // Cari kode koneksi di database
      const { data: codeData, error: codeError } = await supabase
        .from("telegram_connection_codes")
        .select("user_id, is_used, expires_at")
        .eq("code", text)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (codeError || !codeData) {
        // Kode tidak valid atau sudah digunakan
        return NextResponse.json({ success: true })
      }

      // Update telegram_id pengguna
      const { error: updateUserError } = await supabase
        .from("users")
        .update({
          telegram_id: chatId,
          telegram_notifications: true,
        })
        .eq("id", codeData.user_id)

      if (updateUserError) {
        console.error("Error updating user:", updateUserError)
        return NextResponse.json({ success: false, error: updateUserError.message }, { status: 500 })
      }

      // Tandai kode sebagai sudah digunakan
      const { error: updateCodeError } = await supabase
        .from("telegram_connection_codes")
        .update({
          is_used: true,
          telegram_id: chatId,
        })
        .eq("code", text)

      if (updateCodeError) {
        console.error("Error updating code:", updateCodeError)
      }

      // Kirim pesan sukses ke pengguna
      await sendConnectionSuccessMessage(chatId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
