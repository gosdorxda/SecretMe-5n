// Script untuk memperbaiki notification_channel
// Jalankan dengan: npx tsx scripts/fix-notification-channel.ts USER_ID

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/fix-notification-channel.ts USER_ID",
  )
  process.exit(1)
}

// Ambil user ID dari argumen command line
const userId = process.argv[2]
if (!userId) {
  console.error("Please provide a user ID")
  console.error("Usage: npx tsx scripts/fix-notification-channel.ts USER_ID")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function fixNotificationChannel() {
  try {
    console.log("🔧 FIXING NOTIFICATION CHANNEL")
    console.log("============================\n")

    console.log(`Fixing notification channel for user ID: ${userId}`)

    // Ambil data user
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

    console.log("Current user data:")
    console.log(`Name: ${userData.name || "N/A"}`)
    console.log(`Username: ${userData.username || "N/A"}`)
    console.log(`Notification Channel: ${userData.notification_channel || "N/A"}`)
    console.log(`Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}`)

    // Periksa apakah user memiliki Telegram Chat ID
    if (!userData.telegram_chat_id) {
      console.error("❌ User does not have a Telegram chat ID")
      console.error("Please connect Telegram first")
      return
    }

    // Update notification_channel ke "telegram"
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({
        notification_channel: "telegram",
      })
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error updating notification channel:", updateError)
      return
    }

    console.log("\n✅ Notification channel updated successfully")
    console.log("New notification channel:", updateData.notification_channel)

    console.log("\n✨ FIX COMPLETE")
  } catch (error) {
    console.error("Error fixing notification channel:", error)
  }
}

fixNotificationChannel()
