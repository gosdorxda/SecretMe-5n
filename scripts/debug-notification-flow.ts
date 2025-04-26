// Script untuk debug alur notifikasi
// Jalankan dengan: npx tsx scripts/debug-notification-flow.ts USER_ID

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx TELEGRAM_BOT_TOKEN=xxx npx tsx scripts/debug-notification-flow.ts USER_ID",
  )
  process.exit(1)
}

// Ambil user ID dari argumen command line
const userId = process.argv[2]
if (!userId) {
  console.error("Please provide a user ID")
  console.error("Usage: npx tsx scripts/debug-notification-flow.ts USER_ID")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function debugNotificationFlow() {
  try {
    console.log("🔍 DEBUGGING NOTIFICATION FLOW")
    console.log("============================\n")

    // 1. Periksa user
    console.log("1️⃣ CHECKING USER DATA")
    console.log("--------------------")

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("❌ Error fetching user data:", userError)
      console.error("User not found")
      return
    }

    console.log("✅ User found:")
    console.log(`   Name: ${userData.name || "N/A"}`)
    console.log(`   Username: ${userData.username || "N/A"}`)
    console.log(`   Notification Channel: ${userData.notification_channel || "N/A"}`)
    console.log(`   Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}`)

    // 2. Periksa pengaturan notifikasi
    console.log("\n2️⃣ CHECKING NOTIFICATION SETTINGS")
    console.log("------------------------------")

    if (!userData.telegram_chat_id) {
      console.error("❌ User does not have a Telegram chat ID")
      console.error("   Please connect Telegram first")
    } else {
      console.log("✅ Telegram Chat ID is set")
    }

    if (userData.notification_channel !== "telegram") {
      console.warn("⚠️ User's notification channel is not set to 'telegram'")
      console.warn(`   Current notification channel: ${userData.notification_channel || "N/A"}`)
    } else {
      console.log("✅ Notification channel is set to 'telegram'")
    }

    // 3. Periksa Telegram Bot Token
    console.log("\n3️⃣ CHECKING TELEGRAM BOT TOKEN")
    console.log("---------------------------")

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("❌ TELEGRAM_BOT_TOKEN is not defined")
      console.error("   Please set the TELEGRAM_BOT_TOKEN environment variable")
    } else {
      console.log("✅ TELEGRAM_BOT_TOKEN is defined")

      // Test Telegram API
      try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
        const data = await response.json()

        if (data.ok) {
          console.log("✅ Telegram Bot API is working")
          console.log(`   Bot Name: ${data.result.first_name}`)
          console.log(`   Bot Username: @${data.result.username}`)
        } else {
          console.error("❌ Telegram Bot API error:", data.description)
        }
      } catch (error) {
        console.error("❌ Error testing Telegram Bot API:", error)
      }
    }

    // 4. Periksa endpoint notifikasi
    console.log("\n4️⃣ CHECKING NOTIFICATION ENDPOINT")
    console.log("------------------------------")

    try {
      const response = await fetch(`${APP_URL}/api/notifications/trigger`)

      if (response.ok) {
        console.log("✅ Notification endpoint is accessible")
      } else {
        console.error("❌ Notification endpoint error:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("❌ Error accessing notification endpoint:", error)
    }

    // 5. Periksa tabel notification_logs
    console.log("\n5️⃣ CHECKING NOTIFICATION LOGS TABLE")
    console.log("---------------------------------")

    try {
      // Coba cara yang lebih sederhana untuk memeriksa tabel
      const { count, error: countError } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact", head: true })

      if (countError) {
        if (countError.code === "42P01") {
          console.error("❌ notification_logs table does not exist")
          console.log("   You need to create the notification_logs table")
        } else {
          console.error("❌ Error checking notification_logs table:", countError)
        }
      } else {
        console.log("✅ notification_logs table exists")

        // Periksa log terbaru
        const { data: logs, error: logsError } = await supabase
          .from("notification_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)

        if (logsError) {
          console.error("❌ Error fetching notification logs:", logsError)
        } else if (logs && logs.length > 0) {
          console.log("✅ Latest notification log found:")
          console.log(`   ID: ${logs[0].id}`)
          console.log(`   Status: ${logs[0].status}`)
          console.log(`   Channel: ${logs[0].channel}`)
          console.log(`   Created At: ${new Date(logs[0].created_at).toLocaleString()}`)

          if (logs[0].error_message) {
            console.error(`   Error Message: ${logs[0].error_message}`)
          }
        } else {
          console.log("ℹ️ No notification logs found for this user")
        }
      }
    } catch (error) {
      console.error("❌ Error checking notification_logs table:", error)
    }

    // 6. Kirim pesan test
    console.log("\n6️⃣ SENDING TEST MESSAGE")
    console.log("---------------------")

    if (userData.telegram_chat_id && TELEGRAM_BOT_TOKEN) {
      try {
        const testMessage = `
🧪 <b>Test Message</b>

This is a test message from the notification debugging script.
Time: ${new Date().toLocaleString()}

If you receive this message, your Telegram bot is working correctly!
        `

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: userData.telegram_chat_id,
            text: testMessage,
            parse_mode: "HTML",
          }),
        })

        const data = await response.json()

        if (data.ok) {
          console.log("✅ Test message sent successfully")
        } else {
          console.error("❌ Error sending test message:", data.description)
        }
      } catch (error) {
        console.error("❌ Error sending test message:", error)
      }
    } else {
      console.log("ℹ️ Skipping test message (missing Telegram Chat ID or Bot Token)")
    }

    // 7. Rekomendasi
    console.log("\n7️⃣ RECOMMENDATIONS")
    console.log("----------------")

    if (!userData.telegram_chat_id) {
      console.log("• Connect Telegram first")
      console.log("  1. Login to SecretMe")
      console.log("  2. Go to Dashboard or Settings")
      console.log("  3. Find Telegram Notification settings")
      console.log("  4. Generate code and send it to @secretme_official_bot")
    }

    if (userData.notification_channel !== "telegram") {
      console.log("• Update notification_channel to 'telegram'")
      console.log("  Run: npx tsx scripts/fix-user-notification-channel.ts", userId)
    }

    if (!TELEGRAM_BOT_TOKEN) {
      console.log("• Set the TELEGRAM_BOT_TOKEN environment variable")
      console.log("  Add to .env file or export in terminal")
    }

    console.log("\n✨ DEBUG COMPLETE")
  } catch (error) {
    console.error("Error debugging notification flow:", error)
  }
}

debugNotificationFlow()
