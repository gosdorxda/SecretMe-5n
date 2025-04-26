// Script untuk menguji trigger notifikasi
// Jalankan dengan: npx tsx scripts/test-notification-trigger.ts USER_ID [MESSAGE_ID]

import { createClient } from "@supabase/supabase-js"
import fetch from "node-fetch"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/test-notification-trigger.ts USER_ID [MESSAGE_ID]",
  )
  process.exit(1)
}

// Ambil user ID dari argumen command line
const userId = process.argv[2]
if (!userId) {
  console.error("Please provide a user ID")
  console.error("Usage: npx tsx scripts/test-notification-trigger.ts USER_ID [MESSAGE_ID]")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testNotificationTrigger() {
  try {
    console.log(`Testing notification trigger for user ID: ${userId}`)

    // Periksa apakah user ada dan memiliki telegram_chat_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      console.error("User not found")
      return
    }

    console.log("User data:")
    console.log(`Name: ${userData.name || "N/A"}`)
    console.log(`Username: ${userData.username || "N/A"}`)
    console.log(`Notification Channel: ${userData.notification_channel || "N/A"}`)
    console.log(`Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}`)

    if (!userData.telegram_chat_id) {
      console.error("User does not have a Telegram chat ID")
      console.error("Please connect Telegram first")
      return
    }

    if (userData.notification_channel !== "telegram") {
      console.warn("⚠️ WARNING: User's notification channel is not set to 'telegram'")
      console.warn(`Current notification channel: ${userData.notification_channel || "N/A"}`)
      console.warn("This may cause notifications to not be sent via Telegram")

      // Tanyakan apakah ingin melanjutkan
      console.log("\nDo you want to update the notification channel to 'telegram'? (y/n)")
      process.stdin.once("data", async (data) => {
        const input = data.toString().trim().toLowerCase()
        if (input === "y" || input === "yes") {
          const { error: updateError } = await supabase
            .from("users")
            .update({ notification_channel: "telegram" })
            .eq("id", userId)

          if (updateError) {
            console.error("Error updating notification channel:", updateError)
          } else {
            console.log("✅ Notification channel updated to 'telegram'")
          }
        }

        await continueWithTest(userData)
      })
    } else {
      await continueWithTest(userData)
    }
  } catch (error) {
    console.error("Error testing notification trigger:", error)
  }
}

async function continueWithTest(userData: any) {
  try {
    // Cek apakah message ID disediakan
    let messageId = process.argv[3]

    // Jika tidak ada message ID, cari pesan terbaru
    if (!messageId) {
      console.log("No message ID provided, looking for the latest message...")

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("id")
        .eq("user_id", userData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (messageError || !messageData) {
        console.error("Error fetching latest message:", messageError)
        console.error("No messages found for this user")
        return
      }

      messageId = messageData.id
      console.log(`Using latest message ID: ${messageId}`)
    }

    // Kirim request ke endpoint notifikasi
    console.log("\nSending notification trigger request...")
    console.log(`Endpoint: ${APP_URL}/api/notifications/trigger`)
    console.log(`Payload: { userId: "${userData.id}", messageId: "${messageId}", type: "new_message" }`)

    const response = await fetch(`${APP_URL}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userData.id,
        messageId: messageId,
        type: "new_message",
      }),
    })

    const result = await response.json()

    console.log("\nResponse:")
    console.log(`Status: ${response.status}`)
    console.log("Body:", result)

    if (response.ok) {
      console.log("\n✅ Notification trigger request successful")
      console.log("Check your Telegram for the notification")
    } else {
      console.error("\n❌ Notification trigger request failed")
    }

    // Periksa log notifikasi
    console.log("\nChecking notification logs...")
    const { data: logs, error: logsError } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("user_id", userData.id)
      .eq("message_id", messageId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (logsError) {
      console.error("Error fetching notification logs:", logsError)
    } else if (logs && logs.length > 0) {
      console.log("\nLatest notification log:")
      console.log(`ID: ${logs[0].id}`)
      console.log(`Status: ${logs[0].status}`)
      console.log(`Channel: ${logs[0].channel}`)
      console.log(`Created At: ${new Date(logs[0].created_at).toLocaleString()}`)

      if (logs[0].error_message) {
        console.error(`Error Message: ${logs[0].error_message}`)
      }
    } else {
      console.log("No notification logs found for this message")
    }

    process.exit(0)
  } catch (error) {
    console.error("Error in continueWithTest:", error)
    process.exit(1)
  }
}

testNotificationTrigger()
