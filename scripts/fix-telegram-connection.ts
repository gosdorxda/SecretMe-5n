// Script untuk memperbaiki koneksi Telegram
// Jalankan dengan: npx tsx scripts/fix-telegram-connection.ts USER_ID TELEGRAM_CHAT_ID

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/fix-telegram-connection.ts USER_ID TELEGRAM_CHAT_ID",
  )
  process.exit(1)
}

// Ambil user ID dan telegram chat ID dari argumen command line
const userId = process.argv[2]
const telegramChatId = process.argv[3]

if (!userId || !telegramChatId) {
  console.error("Please provide both USER_ID and TELEGRAM_CHAT_ID")
  console.error("Usage: npx tsx scripts/fix-telegram-connection.ts USER_ID TELEGRAM_CHAT_ID")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function fixTelegramConnection() {
  try {
    console.log("🔧 FIXING TELEGRAM CONNECTION")
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
    console.log(`   Current Notification Channel: ${userData.notification_channel || "N/A"}`)
    console.log(`   Current Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}`)

    // 2. Update telegram_chat_id dan notification_channel
    console.log("\n2️⃣ UPDATING TELEGRAM CONNECTION")
    console.log("------------------------------")

    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_chat_id: telegramChatId,
        notification_channel: "telegram",
      })
      .eq("id", userId)

    if (updateError) {
      console.error("❌ Error updating user:", updateError)
      return
    }

    console.log("✅ User updated successfully:")
    console.log(`   Telegram Chat ID set to: ${telegramChatId}`)
    console.log(`   Notification Channel set to: telegram`)

    console.log("\n✨ FIX COMPLETE")
  } catch (error) {
    console.error("Error fixing Telegram connection:", error)
  }
}

fixTelegramConnection()
