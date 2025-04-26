// Script untuk mengirim notifikasi test
// Jalankan dengan: npx tsx scripts/test-notification-trigger.ts USER_ID

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/test-notification-trigger.ts USER_ID",
  )
  process.exit(1)
}

// Ambil user ID dari argumen command line
const userId = process.argv[2]
if (!userId) {
  console.error("Please provide a user ID")
  console.error("Usage: npx tsx scripts/test-notification-trigger.ts USER_ID")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testNotificationTrigger() {
  try {
    console.log("🔔 TESTING NOTIFICATION TRIGGER")
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
      return
    } else {
      console.log("✅ Telegram Chat ID is set")
    }

    if (userData.notification_channel !== "telegram") {
      console.warn("⚠️ User's notification channel is not set to 'telegram'")
      console.warn(`   Current notification channel: ${userData.notification_channel || "N/A"}`)
      console.warn("   This may cause notifications to not be sent via Telegram")
    } else {
      console.log("✅ Notification channel is set to 'telegram'")
    }

    // 3. Kirim notifikasi test
    console.log("\n3️⃣ SENDING TEST NOTIFICATION")
    console.log("---------------------------")

    // Buat pesan test
    const testMessage = {
      userId: userId,
      type: "test",
      message: "This is a test notification from the notification debugging script.",
      data: {
        timestamp: new Date().toISOString(),
        source: "test-notification-trigger.ts",
      },
    }

    // Kirim notifikasi
    try {
      const response = await fetch(`${APP_URL}/api/notifications/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testMessage),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("✅ Test notification sent successfully")
        console.log(`   Response: ${JSON.stringify(data)}`)
      } else {
        console.error("❌ Error sending test notification:", response.status, response.statusText)
        console.error(`   Response: ${JSON.stringify(data)}`)
      }
    } catch (error) {
      console.error("❌ Error sending test notification:", error)
    }

    console.log("\n✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error testing notification trigger:", error)
  }
}

testNotificationTrigger()
