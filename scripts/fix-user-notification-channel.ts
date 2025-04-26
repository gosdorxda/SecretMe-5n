// Script untuk memperbaiki notification_channel pengguna
// Jalankan dengan: npx tsx scripts/fix-user-notification-channel.ts USER_ID

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/fix-user-notification-channel.ts USER_ID",
  )
  process.exit(1)
}

// Ambil user ID dari argumen command line
const userId = process.argv[2]
if (!userId) {
  console.error("Please provide a user ID")
  console.error("Usage: npx tsx scripts/fix-user-notification-channel.ts USER_ID")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function fixUserNotificationChannel() {
  try {
    console.log("🔧 FIXING USER NOTIFICATION CHANNEL")
    console.log("=================================\n")

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
    console.log(`   Current Notification Channel: ${userData.notification_channel || "N/A"}`)
    console.log(`   Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}`)

    // 2. Update notification_channel
    console.log("\n2️⃣ UPDATING NOTIFICATION CHANNEL")
    console.log("------------------------------")

    if (userData.notification_channel === "telegram") {
      console.log("✅ Notification channel is already set to 'telegram'")
      return
    }

    if (!userData.telegram_chat_id) {
      console.error("❌ User does not have a Telegram chat ID")
      console.error("   Please connect Telegram first before setting notification_channel to 'telegram'")
      return
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ notification_channel: "telegram" })
      .eq("id", userId)

    if (updateError) {
      console.error("❌ Error updating notification_channel:", updateError)
    } else {
      console.log("✅ Notification channel updated to 'telegram'")
    }

    console.log("\n✨ FIX COMPLETE")
  } catch (error) {
    console.error("Error fixing user notification channel:", error)
  }
}

fixUserNotificationChannel()
