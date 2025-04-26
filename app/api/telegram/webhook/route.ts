import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("Webhook received request")

    // Parse body
    const body = await request.json()
    console.log("Webhook request body:", JSON.stringify(body, null, 2))

    // Respond immediately to prevent timeout
    const response = NextResponse.json({ ok: true })

    // Process the webhook asynchronously
    processWebhook(body).catch((error) => {
      console.error("Error processing webhook:", error)
    })

    return response
  } catch (error) {
    console.error("Error in webhook handler:", error)
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 200 })
  }
}

async function processWebhook(body: any) {
  // Skip if not a message
  if (!body.message) {
    console.log("Not a message, skipping")
    return
  }

  const supabase = createRouteHandlerClient({ cookies })

  // Extract data from the message
  const chatId = body.message.chat.id
  const text = body.message.text
  const firstName = body.message.from.first_name

  console.log(`Processing message from ${firstName} (${chatId}): ${text}`)

  // Handle verification code
  if (text && /^\d{6}$/.test(text)) {
    await handleVerificationCode(supabase, chatId, text)
  }
  // Handle commands
  else if (text && text.startsWith("/")) {
    await handleCommand(supabase, chatId, text, firstName)
  }
  // Handle other messages
  else {
    await sendMessage(
      chatId,
      `Hai ${firstName}, saya adalah bot notifikasi SecretMe. Gunakan /help untuk melihat perintah yang tersedia.`,
    )
  }
}

// Dalam fungsi handleVerificationCode, pastikan notification_channel diatur dengan benar

async function handleVerificationCode(supabase: any, chatId: string, code: string) {
  try {
    console.log(`Processing verification code: ${code} from chat ID: ${chatId}`)

    // Cari kode di database
    const { data: verificationData, error: verificationError } = await supabase
      .from("telegram_verification")
      .select("user_id, code")
      .eq("code", code)
      .single()

    if (verificationError || !verificationData) {
      console.log(`Invalid verification code: ${code}`)
      await sendMessage(chatId, "❌ Kode verifikasi tidak valid atau sudah kadaluarsa. Silakan coba lagi.")
      return
    }

    console.log(`Valid verification code for user ID: ${verificationData.user_id}`)

    // Update user dengan Telegram chat ID dan notification_channel
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_chat_id: chatId.toString(),
        notification_channel: "telegram", // Pastikan ini diatur ke 'telegram'
      })
      .eq("id", verificationData.user_id)

    if (updateError) {
      console.error("Error updating user with Telegram chat ID:", updateError)
      await sendMessage(chatId, "❌ Terjadi kesalahan saat menghubungkan akun Anda. Silakan coba lagi nanti.")
      return
    }

    // Hapus kode verifikasi
    await supabase.from("telegram_verification").delete().eq("code", code)

    // Kirim pesan sukses
    await sendMessage(
      chatId,
      "✅ Akun Anda berhasil terhubung dengan SecretMe! Anda akan menerima notifikasi saat ada pesan baru.\n\nNotifikasi Telegram telah diaktifkan sebagai channel notifikasi utama Anda.",
    )

    // Kirim pesan test
    setTimeout(async () => {
      await sendMessage(
        chatId,
        "🧪 Pesan Test\n\nIni adalah pesan test dari SecretMe. Jika Anda menerima pesan ini, berarti notifikasi Telegram Anda sudah berfungsi dengan baik! 🎉",
      )
    }, 2000)
  } catch (error) {
    console.error("Error handling verification code:", error)
    await sendMessage(chatId, "❌ Terjadi kesalahan saat memproses kode verifikasi. Silakan coba lagi nanti.")
  }
}

async function handleCommand(supabase: any, chatId: string, command: string, firstName: string) {
  switch (command) {
    case "/start":
      await sendMessage(
        chatId,
        `Hai ${firstName}! 👋\n\nSelamat datang di bot notifikasi SecretMe. Saya akan mengirimkan notifikasi saat Anda menerima pesan baru di SecretMe.\n\nUntuk menghubungkan akun Anda, silakan masukkan kode verifikasi 6 digit dari halaman pengaturan SecretMe Anda.`,
      )
      break

    case "/help":
      await sendMessage(
        chatId,
        `🔍 <b>Bantuan Bot SecretMe</b>\n\nBerikut adalah perintah yang tersedia:\n\n/start - Mulai bot dan lihat pesan selamat datang\n/help - Tampilkan bantuan dan instruksi\n/status - Periksa status koneksi Anda\n/disconnect - Putuskan koneksi akun Anda dari SecretMe\n\nUntuk menghubungkan akun Anda, masukkan kode verifikasi 6 digit dari halaman pengaturan SecretMe Anda.`,
      )
      break

    case "/status":
      await checkStatus(supabase, chatId)
      break

    case "/disconnect":
      await disconnectAccount(supabase, chatId)
      break

    default:
      await sendMessage(chatId, `Perintah tidak dikenal. Gunakan /help untuk melihat perintah yang tersedia.`)
  }
}

async function checkStatus(supabase: any, chatId: string) {
  try {
    // Check if chat ID is connected to any user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, username, notification_channel")
      .eq("telegram_chat_id", chatId.toString())
      .single()

    if (userError || !userData) {
      await sendMessage(
        chatId,
        "❌ Akun Anda belum terhubung dengan SecretMe. Silakan masukkan kode verifikasi 6 digit dari halaman pengaturan SecretMe Anda.",
      )
      return
    }

    const statusMessage = `
✅ <b>Status Koneksi</b>

Akun Anda terhubung dengan SecretMe!

<b>Nama:</b> ${userData.name || "Tidak diatur"}
<b>Username:</b> ${userData.username || "Tidak diatur"}
<b>Channel Notifikasi:</b> ${userData.notification_channel === "telegram" ? "Telegram ✅" : "Bukan Telegram ❌"}

Anda akan menerima notifikasi saat ada pesan baru di SecretMe.
    `

    await sendMessage(chatId, statusMessage)
  } catch (error) {
    console.error("Error checking status:", error)
    await sendMessage(chatId, "❌ Terjadi kesalahan saat memeriksa status. Silakan coba lagi nanti.")
  }
}

async function disconnectAccount(supabase: any, chatId: string) {
  try {
    // Check if chat ID is connected to any user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .eq("telegram_chat_id", chatId.toString())
      .single()

    if (userError || !userData) {
      await sendMessage(chatId, "❌ Akun Anda belum terhubung dengan SecretMe.")
      return
    }

    // Update user to remove Telegram chat ID
    const updateData: any = {
      telegram_chat_id: null,
    }

    // Cek apakah kolom notification_channel ada
    const { data: columns, error: columnsError } = await supabase.rpc("get_table_columns", { table_name: "users" })

    if (!columnsError && columns && columns.includes("notification_channel")) {
      updateData.notification_channel = null
    }

    const { error: updateError } = await supabase.from("users").update(updateData).eq("id", userData.id)

    if (updateError) {
      console.error("Error disconnecting account:", updateError)
      await sendMessage(chatId, "❌ Terjadi kesalahan saat memutuskan koneksi. Silakan coba lagi nanti.")
      return
    }

    await sendMessage(
      chatId,
      "✅ Akun Anda berhasil diputuskan dari SecretMe. Anda tidak akan lagi menerima notifikasi di Telegram.",
    )
  } catch (error) {
    console.error("Error disconnecting account:", error)
    await sendMessage(chatId, "❌ Terjadi kesalahan saat memutuskan koneksi. Silakan coba lagi nanti.")
  }
}

async function sendMessage(chatId: string, message: string) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not defined")
      return
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("Error sending message to Telegram:", data)
    }

    return data
  } catch (error) {
    console.error("Error sending message to Telegram:", error)
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ ok: true, message: "Telegram webhook is active" })
}
