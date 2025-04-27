import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { TELEGRAM_BOT_TOKEN } from "@/lib/telegram/config"

// Interface untuk update Telegram
interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
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
    const update: TelegramUpdate = await request.json()

    // Hanya proses pesan teks
    if (!update.message?.text) {
      return NextResponse.json({ success: true })
    }

    const chatId = update.message.chat.id
    const text = update.message.text
    const supabase = createClient(cookies())

    // Tangani perintah /start
    if (text === "/start") {
      // Kirim pesan selamat datang dengan ID Telegram pengguna
      await sendTelegramMessage(
        chatId,
        `🎉 *Selamat Datang di Bot SecretMe!*\n\n` +
          `ID Telegram Anda adalah: \`${chatId}\`\n\n` +
          `Salin ID ini dan tempelkan di pengaturan notifikasi Telegram di akun SecretMe Anda untuk mengaktifkan notifikasi.\n\n` +
          `Perintah yang tersedia:\n` +
          `/start - Tampilkan pesan ini dan ID Telegram Anda\n` +
          `/help - Tampilkan bantuan penggunaan bot\n` +
          `/status - Cek status koneksi bot dengan akun SecretMe Anda`,
      )
      return NextResponse.json({ success: true })
    }

    // Tangani perintah /help
    if (text === "/help") {
      await sendTelegramMessage(
        chatId,
        `📚 *Bantuan Bot SecretMe*\n\n` +
          `Bot ini digunakan untuk menerima notifikasi dari akun SecretMe Anda.\n\n` +
          `Untuk mengaktifkan notifikasi:\n` +
          `1. Dapatkan ID Telegram Anda dengan perintah /start\n` +
          `2. Buka akun SecretMe Anda\n` +
          `3. Pergi ke Pengaturan > Notifikasi\n` +
          `4. Pilih Telegram sebagai saluran notifikasi\n` +
          `5. Masukkan ID Telegram Anda\n` +
          `6. Verifikasi dan simpan pengaturan\n\n` +
          `Perintah yang tersedia:\n` +
          `/start - Dapatkan ID Telegram Anda\n` +
          `/help - Tampilkan pesan bantuan ini\n` +
          `/status - Cek status koneksi bot dengan akun SecretMe Anda`,
      )
      return NextResponse.json({ success: true })
    }

    // Tangani perintah /status
    if (text === "/status") {
      // Cek apakah ID Telegram ini terdaftar di database
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("telegram_id", chatId.toString())
        .single()

      if (error || !userData) {
        await sendTelegramMessage(
          chatId,
          `❌ *Status Koneksi*\n\n` +
            `ID Telegram Anda belum terhubung dengan akun SecretMe manapun.\n\n` +
            `Untuk menghubungkan:\n` +
            `1. Dapatkan ID Telegram Anda dengan perintah /start\n` +
            `2. Buka akun SecretMe Anda\n` +
            `3. Pergi ke Pengaturan > Notifikasi\n` +
            `4. Pilih Telegram sebagai saluran notifikasi\n` +
            `5. Masukkan ID Telegram Anda\n` +
            `6. Verifikasi dan simpan pengaturan`,
        )
      } else {
        await sendTelegramMessage(
          chatId,
          `✅ *Status Koneksi*\n\n` +
            `ID Telegram Anda terhubung dengan akun SecretMe:\n` +
            `Nama: ${userData.name}\n` +
            `Email: ${userData.email}\n\n` +
            `Anda akan menerima notifikasi pesan masuk di akun ini.`,
        )
      }
      return NextResponse.json({ success: true })
    }

    // Tangani pesan lainnya
    await sendTelegramMessage(
      chatId,
      `Maaf, saya tidak mengerti perintah tersebut. Gunakan salah satu perintah berikut:\n\n` +
        `/start - Dapatkan ID Telegram Anda\n` +
        `/help - Tampilkan bantuan penggunaan bot\n` +
        `/status - Cek status koneksi bot dengan akun SecretMe Anda`,
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error handling Telegram webhook:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process Telegram webhook" },
      { status: 500 },
    )
  }
}

// Fungsi untuk mengirim pesan ke Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending Telegram message:", error)
    throw error
  }
}
