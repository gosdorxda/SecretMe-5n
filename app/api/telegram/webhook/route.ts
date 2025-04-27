import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { TELEGRAM_BOT_TOKEN } from "@/lib/telegram/config"
import {
  sendTelegramMessage,
  sendConnectionSuccessMessage,
  sendDisconnectionMessage,
  sendHelpMessage,
} from "@/lib/telegram/service"

// Tipe untuk pesan Telegram
interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    chat: {
      id: number
      first_name: string
      username?: string
      type: string
    }
    date: number
    text?: string
  }
}

export async function POST(request: Request) {
  try {
    // Verifikasi bahwa request berasal dari Telegram
    const telegramBotToken = TELEGRAM_BOT_TOKEN
    if (!telegramBotToken) {
      return NextResponse.json({ success: false, error: "Bot token not configured" }, { status: 500 })
    }

    // Parse update dari Telegram
    const update: TelegramUpdate = await request.json()

    // Jika tidak ada pesan, abaikan
    if (!update.message || !update.message.text) {
      return NextResponse.json({ success: true })
    }

    const chatId = update.message.chat.id.toString()
    const messageText = update.message.text.trim()
    const firstName = update.message.from.first_name || "User"

    // Inisialisasi Supabase client
    const supabase = createClient(cookies())

    // Handle perintah /start
    if (messageText === "/start") {
      await sendTelegramMessage({
        chat_id: chatId,
        text:
          `Halo ${firstName}! Selamat datang di SecretMe Bot.\n\n` +
          `Untuk menghubungkan akun Anda, silakan kirim kode 6 digit yang Anda dapatkan dari website SecretMe.\n\n` +
          `Contoh: 123456`,
        parse_mode: "Markdown",
      })
      return NextResponse.json({ success: true })
    }

    // Handle perintah /help
    if (messageText === "/help") {
      await sendHelpMessage(chatId)
      return NextResponse.json({ success: true })
    }

    // Handle perintah /status
    if (messageText === "/status") {
      // Cek apakah ID Telegram ini terdaftar di database
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("telegram_id", chatId)
        .single()

      if (error || !userData) {
        await sendTelegramMessage({
          chat_id: chatId,
          text:
            `❌ *Status Koneksi*\n\n` +
            `ID Telegram Anda belum terhubung dengan akun SecretMe manapun.\n\n` +
            `Untuk menghubungkan:\n` +
            `1. Buka website SecretMe\n` +
            `2. Pergi ke Pengaturan > Notifikasi\n` +
            `3. Klik tombol "Hubungkan ke Telegram"\n` +
            `4. Kirim kode 6 digit yang muncul ke bot ini`,
          parse_mode: "Markdown",
        })
      } else {
        await sendTelegramMessage({
          chat_id: chatId,
          text:
            `✅ *Status Koneksi*\n\n` +
            `ID Telegram Anda terhubung dengan akun SecretMe:\n` +
            `Nama: ${userData.name}\n` +
            `Email: ${userData.email}\n\n` +
            `Anda akan menerima notifikasi pesan masuk di akun ini.`,
          parse_mode: "Markdown",
        })
      }
      return NextResponse.json({ success: true })
    }

    // Handle perintah /disconnect
    if (messageText === "/disconnect") {
      // Cek apakah ID Telegram ini terdaftar di database
      const { data: userData, error } = await supabase.from("users").select("id").eq("telegram_id", chatId).single()

      if (error || !userData) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: `❌ *Error*\n\nID Telegram Anda tidak terhubung dengan akun SecretMe manapun.`,
          parse_mode: "Markdown",
        })
        return NextResponse.json({ success: true })
      }

      // Update user untuk menghapus Telegram ID
      const { error: updateError } = await supabase
        .from("users")
        .update({
          telegram_id: null,
          telegram_notifications: false,
          notification_channel: null,
        })
        .eq("id", userData.id)

      if (updateError) {
        console.error("Error disconnecting Telegram account:", updateError)
        await sendTelegramMessage({
          chat_id: chatId,
          text: `❌ *Error*\n\nTerjadi kesalahan saat memutuskan koneksi akun Anda. Silakan coba lagi nanti.`,
          parse_mode: "Markdown",
        })
        return NextResponse.json({ success: true })
      }

      // Kirim pesan sukses
      await sendDisconnectionMessage(chatId)
      return NextResponse.json({ success: true })
    }

    // Jika pesan adalah kode koneksi (6 digit numerik), coba hubungkan
    if (/^\d{6}$/.test(messageText)) {
      // Cari kode koneksi di database
      const { data: connectionData, error: connectionError } = await supabase
        .from("telegram_connection_codes")
        .select("user_id, is_used, expires_at")
        .eq("code", messageText)
        .gt("expires_at", new Date().toISOString())
        .eq("is_used", false)
        .single()

      if (connectionError || !connectionData) {
        await sendTelegramMessage({
          chat_id: chatId,
          text: `❌ *Kode Tidak Valid*\n\nMaaf, kode koneksi tidak valid atau sudah kadaluarsa. Silakan generate kode baru dari website SecretMe.`,
          parse_mode: "Markdown",
        })
        return NextResponse.json({ success: true })
      }

      // Update user dengan Telegram ID
      const { error: updateError } = await supabase
        .from("users")
        .update({
          telegram_id: chatId,
          telegram_notifications: true,
          notification_channel: "telegram",
        })
        .eq("id", connectionData.user_id)

      if (updateError) {
        console.error("Error updating user with Telegram ID:", updateError)
        await sendTelegramMessage({
          chat_id: chatId,
          text: `❌ *Error*\n\nMaaf, terjadi kesalahan saat menghubungkan akun Anda. Silakan coba lagi nanti.`,
          parse_mode: "Markdown",
        })
        return NextResponse.json({ success: true })
      }

      // Tandai kode koneksi sebagai sudah digunakan
      await supabase.from("telegram_connection_codes").update({ is_used: true }).eq("code", messageText)

      // Kirim pesan sukses
      await sendConnectionSuccessMessage(chatId)

      return NextResponse.json({ success: true })
    }

    // Jika pesan lainnya, kirim petunjuk
    await sendTelegramMessage({
      chat_id: chatId,
      text: `Untuk menghubungkan akun SecretMe Anda, silakan kirim kode 6 digit yang Anda dapatkan dari website SecretMe.\n\nJika Anda belum memiliki kode, silakan kunjungi halaman pengaturan notifikasi di website SecretMe.\n\nGunakan perintah /help untuk bantuan.`,
      parse_mode: "Markdown",
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error handling Telegram webhook:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process Telegram webhook" },
      { status: 500 },
    )
  }
}
