import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getTelegramApiUrl } from "@/lib/telegram/config"

// Helper function to handle /start command
async function handleStartCommand(chatId: string) {
  const welcomeMessage = `
<b>🎉 Selamat Datang di SecretMe Bot!</b>

Bot ini akan mengirimkan notifikasi saat Anda menerima pesan baru di SecretMe.

Untuk menghubungkan akun SecretMe Anda:
1. Buka situs SecretMe
2. Masuk ke pengaturan profil
3. Pilih "Notifikasi Telegram"
4. Generate kode verifikasi
5. Kirim kode tersebut ke bot ini

<i>Gunakan /help untuk melihat perintah yang tersedia.</i>
`

  await fetch(getTelegramApiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: welcomeMessage,
      parse_mode: "HTML",
    }),
  })
}

// Helper function to handle /help command
async function handleHelpCommand(chatId: string) {
  const helpMessage = `
<b>🔍 Bantuan SecretMe Bot</b>

<b>Perintah yang tersedia:</b>
/start - Memulai bot dan melihat pesan selamat datang
/help - Menampilkan pesan bantuan ini
/status - Memeriksa status koneksi Anda
/disconnect - Memutuskan koneksi akun Anda dari SecretMe

<b>Cara Menghubungkan Akun:</b>
1. Buka situs SecretMe
2. Masuk ke pengaturan profil
3. Pilih "Notifikasi Telegram"
4. Generate kode verifikasi
5. Kirim kode tersebut ke bot ini

<b>Butuh bantuan lebih lanjut?</b>
Kunjungi halaman bantuan kami atau hubungi tim dukungan.
`

  await fetch(getTelegramApiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: helpMessage,
      parse_mode: "HTML",
    }),
  })
}

// Helper function to handle /status command
async function handleStatusCommand(chatId: string, supabase: any) {
  try {
    // Cari user dengan chat_id ini
    const { data, error } = await supabase
      .from("users")
      .select("id, username, notification_channel")
      .eq("telegram_chat_id", chatId)
      .single()

    if (error || !data) {
      // User tidak ditemukan
      await fetch(getTelegramApiUrl("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `
<b>❌ Tidak Terhubung</b>

Akun Telegram Anda belum terhubung dengan akun SecretMe.

Untuk menghubungkan:
1. Buka situs SecretMe
2. Masuk ke pengaturan profil
3. Pilih "Notifikasi Telegram"
4. Generate kode verifikasi
5. Kirim kode tersebut ke bot ini
`,
          parse_mode: "HTML",
        }),
      })
      return
    }

    // User ditemukan
    const notificationStatus = data.notification_channel === "telegram" ? "aktif" : "nonaktif"

    await fetch(getTelegramApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `
<b>✅ Terhubung</b>

Akun Telegram Anda terhubung dengan akun SecretMe:
Username: <b>${data.username || "Belum diatur"}</b>
Status Notifikasi: <b>${notificationStatus}</b>

Anda akan ${notificationStatus === "aktif" ? "menerima" : "tidak menerima"} notifikasi pesan baru melalui Telegram.
`,
        parse_mode: "HTML",
      }),
    })
  } catch (error) {
    console.error("Error handling status command:", error)
    await fetch(getTelegramApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Terjadi kesalahan saat memeriksa status. Silakan coba lagi nanti.",
      }),
    })
  }
}

// Helper function to handle /disconnect command
async function handleDisconnectCommand(chatId: string, supabase: any) {
  try {
    // Cari user dengan chat_id ini
    const { data, error } = await supabase.from("users").select("id, username").eq("telegram_chat_id", chatId).single()

    if (error || !data) {
      // User tidak ditemukan
      await fetch(getTelegramApiUrl("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Akun Anda belum terhubung dengan SecretMe.",
        }),
      })
      return
    }

    // Update user untuk menghapus chat_id dan mengubah notification_channel
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_chat_id: null,
        notification_channel: "email",
      })
      .eq("id", data.id)

    if (updateError) {
      throw updateError
    }

    await fetch(getTelegramApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `
<b>🔌 Terputus</b>

Akun Telegram Anda telah terputus dari SecretMe.
Anda tidak akan lagi menerima notifikasi pesan baru melalui Telegram.

Untuk menghubungkan kembali, silakan gunakan fitur "Notifikasi Telegram" di pengaturan profil Anda.
`,
        parse_mode: "HTML",
      }),
    })
  } catch (error) {
    console.error("Error handling disconnect command:", error)
    await fetch(getTelegramApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Terjadi kesalahan saat memutuskan koneksi. Silakan coba lagi nanti.",
      }),
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const update = await request.json()

    console.log("Received Telegram webhook:", JSON.stringify(update, null, 2))

    // Verifikasi bahwa ini adalah pesan dari bot
    if (!update.message || !update.message.chat) {
      return NextResponse.json({ success: false, error: "Invalid message format" })
    }

    const { text, chat } = update.message
    const chatId = chat.id.toString()

    // Handle commands
    if (text === "/start") {
      await handleStartCommand(chatId)
      return NextResponse.json({ success: true })
    } else if (text === "/help") {
      await handleHelpCommand(chatId)
      return NextResponse.json({ success: true })
    } else if (text === "/status") {
      await handleStatusCommand(chatId, supabase)
      return NextResponse.json({ success: true })
    } else if (text === "/disconnect") {
      await handleDisconnectCommand(chatId, supabase)
      return NextResponse.json({ success: true })
    }

    // If no text, return
    if (!text) {
      return NextResponse.json({ success: false, error: "No text in message" })
    }

    // Cek apakah pesan adalah kode verifikasi (6 digit)
    if (/^\d{6}$/.test(text)) {
      const code = text

      console.log(`Processing verification code: ${code} from chat ID: ${chatId}`)

      // Cari kode di database
      const { data, error } = await supabase
        .from("telegram_verification")
        .select("user_id")
        .eq("code", code)
        .gt("expires_at", new Date().toISOString())
        .single()

      if (error || !data) {
        console.error("Verification code not found or expired:", error)

        // Kirim pesan bahwa kode tidak valid
        await fetch(getTelegramApiUrl("sendMessage"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Kode verifikasi tidak valid atau sudah kadaluarsa.",
          }),
        })

        return NextResponse.json({ success: false, error: "Invalid or expired code" })
      }

      console.log(`Valid verification code for user ID: ${data.user_id}`)

      // Update user dengan chat_id Telegram
      const { error: updateError } = await supabase
        .from("users")
        .update({
          telegram_chat_id: chatId,
          notification_channel: "telegram",
        })
        .eq("id", data.user_id)

      if (updateError) {
        console.error("Error updating user with Telegram chat ID:", updateError)
        return NextResponse.json({ success: false, error: "Failed to update user" })
      }

      // Hapus kode verifikasi
      await supabase.from("telegram_verification").delete().eq("code", code)

      // Kirim pesan sukses
      await fetch(getTelegramApiUrl("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ Akun Anda berhasil terhubung dengan SecretMe! Anda akan menerima notifikasi saat ada pesan baru.",
          parse_mode: "HTML",
        }),
      })

      console.log("User successfully connected to Telegram")
    } else {
      // Pesan bukan kode verifikasi, kirim instruksi
      await fetch(getTelegramApiUrl("sendMessage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `
Selamat datang di SecretMe Bot! 

Untuk menghubungkan akun Anda, silakan masukkan kode verifikasi 6 digit dari aplikasi SecretMe.

Gunakan /help untuk melihat perintah yang tersedia.
`,
          parse_mode: "HTML",
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in Telegram webhook:", error)
    return NextResponse.json({ success: false, error: error.message })
  }
}
