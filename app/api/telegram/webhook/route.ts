import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { TELEGRAM_BOT_TOKEN } from "@/lib/telegram/config"

// Tipe untuk update Telegram
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
      type: string
      first_name: string
      username?: string
    }
    date: number
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
      username?: string
    }
    message?: {
      message_id: number
      chat: {
        id: number
        type: string
      }
    }
    data: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifikasi bahwa request berasal dari Telegram
    const telegramToken = TELEGRAM_BOT_TOKEN
    if (!telegramToken) {
      console.error("TELEGRAM_BOT_TOKEN is not set")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    // Parse body
    const body = await request.json()
    console.log("Received Telegram webhook:", JSON.stringify(body, null, 2))

    // Validasi update
    const update = body as TelegramUpdate
    if (!update || !update.update_id) {
      console.error("Invalid Telegram update format")
      return NextResponse.json({ error: "Invalid update format" }, { status: 400 })
    }

    // Proses pesan
    if (update.message) {
      await processMessage(update.message)
    }

    // Proses callback query (untuk tombol inline)
    if (update.callback_query) {
      await processCallbackQuery(update.callback_query)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Telegram webhook:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

async function processMessage(message: TelegramUpdate["message"]) {
  if (!message) return

  const chatId = message.chat.id.toString()
  const text = message.text || ""
  const username = message.from.username || ""

  console.log(`Processing message from ${username} (${chatId}): ${text}`)

  // Cek apakah ini adalah pesan /start
  if (text.startsWith("/start")) {
    await handleStartCommand(chatId, message.from.first_name)
    return
  }

  // Cek apakah ini adalah pesan verifikasi
  if (text.match(/^\/verify\s+\d{6}$/)) {
    const code = text.split(" ")[1]
    await handleVerificationCode(chatId, code)
    return
  }

  // Pesan default jika tidak ada yang cocok
  await sendTelegramMessage(
    chatId,
    "Maaf, saya tidak mengerti perintah tersebut. Silakan gunakan /start untuk memulai.",
  )
}

async function processCallbackQuery(callbackQuery: TelegramUpdate["callback_query"]) {
  if (!callbackQuery) return

  const chatId = callbackQuery.message?.chat.id.toString() || ""
  const data = callbackQuery.data

  console.log(`Processing callback query from ${callbackQuery.from.id}: ${data}`)

  // Proses callback query berdasarkan data
  if (data.startsWith("verify_")) {
    // Format: verify_userId
    const userId = data.split("_")[1]
    await handleVerifyCallback(chatId, userId)
  }
}

async function handleStartCommand(chatId: string, firstName: string) {
  const welcomeMessage = `Halo ${firstName}! 👋

Selamat datang di bot SecretMe. Bot ini akan mengirimkan notifikasi saat Anda menerima pesan baru di SecretMe.

Untuk menghubungkan akun Anda, silakan gunakan perintah verifikasi di aplikasi SecretMe.`

  await sendTelegramMessage(chatId, welcomeMessage)
}

async function handleVerificationCode(chatId: string, code: string) {
  try {
    const supabase = createClient(cookies())

    // Cari kode verifikasi di database
    const { data, error } = await supabase
      .from("telegram_verification_codes")
      .select("*")
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !data) {
      console.error("Error verifying code:", error)
      await sendTelegramMessage(
        chatId,
        "Kode verifikasi tidak valid atau sudah kedaluwarsa. Silakan coba lagi dengan kode baru.",
      )
      return
    }

    // Update user dengan telegram_id
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_id: chatId,
        telegram_notifications: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user_id)

    if (updateError) {
      console.error("Error updating user:", updateError)
      await sendTelegramMessage(chatId, "Terjadi kesalahan saat menghubungkan akun Anda. Silakan coba lagi nanti.")
      return
    }

    // Hapus kode verifikasi
    await supabase.from("telegram_verification_codes").delete().eq("code", code)

    // Kirim pesan sukses
    await sendTelegramMessage(
      chatId,
      "✅ Akun Anda berhasil terhubung dengan SecretMe! Anda akan menerima notifikasi saat ada pesan baru.",
    )

    console.log(`Successfully linked Telegram chat ${chatId} to user ${data.user_id}`)
  } catch (error) {
    console.error("Error handling verification code:", error)
    await sendTelegramMessage(chatId, "Terjadi kesalahan saat memproses kode verifikasi. Silakan coba lagi nanti.")
  }
}

async function handleVerifyCallback(chatId: string, userId: string) {
  try {
    const supabase = createClient(cookies())

    // Update user dengan telegram_id
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_id: chatId,
        telegram_notifications: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user:", updateError)
      await sendTelegramMessage(chatId, "Terjadi kesalahan saat menghubungkan akun Anda. Silakan coba lagi nanti.")
      return
    }

    // Kirim pesan sukses
    await sendTelegramMessage(
      chatId,
      "✅ Akun Anda berhasil terhubung dengan SecretMe! Anda akan menerima notifikasi saat ada pesan baru.",
    )

    console.log(`Successfully linked Telegram chat ${chatId} to user ${userId}`)
  } catch (error) {
    console.error("Error handling verify callback:", error)
    await sendTelegramMessage(chatId, "Terjadi kesalahan saat memproses verifikasi. Silakan coba lagi nanti.")
  }
}

async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode?: "Markdown" | "HTML",
  disableWebPagePreview = false,
) {
  try {
    const telegramToken = TELEGRAM_BOT_TOKEN
    if (!telegramToken) {
      console.error("TELEGRAM_BOT_TOKEN is not set")
      return
    }

    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: disableWebPagePreview,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Error sending Telegram message:", data)
    }

    return data
  } catch (error) {
    console.error("Error sending Telegram message:", error)
  }
}
