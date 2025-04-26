// Script untuk mengirim notifikasi test ke pengguna
// Jalankan dengan: npx tsx scripts/send-test-notification.ts <user_id>

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secretme.site"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function sendTestNotification(userId: string) {
  try {
    console.log(`Mengirim notifikasi test ke user ID: ${userId}`)

    // Ambil data user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      console.log("User tidak ditemukan")
      return
    }

    console.log("User data:", userData)

    if (userData.notification_channel !== "telegram" || !userData.telegram_chat_id) {
      console.log("User tidak menggunakan notifikasi Telegram atau tidak memiliki Telegram Chat ID")
      return
    }

    // Kirim notifikasi test
    const response = await fetch(`${APP_URL}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userData.id,
        messageId: "test-message",
        type: "new_message",
      }),
    })

    const data = await response.json()

    console.log("Response:", data)

    if (data.success) {
      console.log("✅ Notifikasi test berhasil dikirim")
    } else {
      console.log("❌ Gagal mengirim notifikasi test:", data.error)
    }
  } catch (error) {
    console.error("Error sending test notification:", error)
  }
}

// Get user ID from command line arguments
const userId = process.argv[2]

if (!userId) {
  console.error("User ID is required")
  console.log("Usage: npx tsx scripts/send-test-notification.ts <user_id>")
  process.exit(1)
}

sendTestNotification(userId)
