// Script untuk mengirim notifikasi test
// Jalankan dengan: npx tsx scripts/send-test-notification.ts USER_ID

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

async function sendTestNotification() {
  try {
    const userId = process.argv[2]

    if (!userId) {
      console.error("Please provide a user ID")
      console.log("Usage: npx tsx scripts/send-test-notification.ts USER_ID")
      process.exit(1)
    }

    console.log(`Sending test notification to user: ${userId}`)

    // Ambil data user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      console.error("User not found")
      process.exit(1)
    }

    console.log("User data:", userData)

    if (userData.notification_channel !== "telegram" || !userData.telegram_chat_id) {
      console.error("User does not have Telegram notifications enabled")
      console.log("User notification settings:", {
        channel: userData.notification_channel,
        telegram_chat_id: userData.telegram_chat_id,
      })
      process.exit(1)
    }

    // Kirim notifikasi test
    const response = await fetch(`${APP_URL}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userData.id,
        messageId: "test-message-id",
        type: "new_message",
      }),
    })

    const result = await response.json()

    console.log("Notification result:", result)

    if (result.success) {
      console.log("✅ Test notification sent successfully")
    } else {
      console.error("❌ Failed to send test notification:", result.error)
    }
  } catch (error) {
    console.error("Error sending test notification:", error)
  }
}

sendTestNotification()
