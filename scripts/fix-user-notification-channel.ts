import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import type { Database } from "../lib/supabase/database.types"

// Load environment variables
dotenv.config()

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// Get user ID from command line arguments
const userId = process.argv[2]

if (!userId) {
  console.error("❌ Please provide a user ID as an argument")
  console.log("Usage: npx tsx scripts/fix-user-notification-channel.ts USER_ID")
  process.exit(1)
}

async function fixUserNotificationChannel() {
  console.log("🔧 FIXING USER NOTIFICATION CHANNEL")
  console.log("=================================\n")

  // 1. Check user data
  console.log("1️⃣ CHECKING USER DATA")
  console.log("--------------------")

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, name, username, notification_channel, telegram_chat_id")
    .eq("id", userId)
    .single()

  if (userError || !userData) {
    console.error("❌ User not found:", userError?.message || "Unknown error")
    process.exit(1)
  }

  console.log("✅ User found:")
  console.log(`   Name: ${userData.name || "N/A"}`)
  console.log(`   Username: ${userData.username || "N/A"}`)
  console.log(`   Current Notification Channel: ${userData.notification_channel || "N/A"}`)
  console.log(`   Telegram Chat ID: ${userData.telegram_chat_id || "N/A"}\n`)

  // 2. Update notification channel
  console.log("2️⃣ UPDATING NOTIFICATION CHANNEL")
  console.log("-------------------------------")

  if (userData.notification_channel === "telegram") {
    console.log("✅ Notification channel is already set to 'telegram'")
  } else {
    const { error: updateError } = await supabase
      .from("users")
      .update({ notification_channel: "telegram" })
      .eq("id", userId)

    if (updateError) {
      console.error("❌ Error updating notification channel:", updateError.message)
      process.exit(1)
    }

    console.log("✅ Notification channel updated to 'telegram'")
  }
  console.log("")

  // 3. Check Telegram chat ID
  console.log("3️⃣ CHECKING TELEGRAM CHAT ID")
  console.log("---------------------------")

  if (!userData.telegram_chat_id) {
    console.log("⚠️ User does not have a Telegram chat ID")
    console.log("   Please connect Telegram first:")
    console.log("   1. Login to SecretMe")
    console.log("   2. Go to Dashboard or Settings")
    console.log("   3. Find Telegram Notification settings")
    console.log("   4. Generate code and send it to @secretme_official_bot")
  } else {
    console.log("✅ Telegram Chat ID is set")
  }
  console.log("")

  // 4. Verify changes
  console.log("4️⃣ VERIFYING CHANGES")
  console.log("-------------------")

  const { data: updatedUserData, error: verifyError } = await supabase
    .from("users")
    .select("id, name, username, notification_channel, telegram_chat_id")
    .eq("id", userId)
    .single()

  if (verifyError || !updatedUserData) {
    console.error("❌ Error verifying changes:", verifyError?.message || "Unknown error")
    process.exit(1)
  }

  console.log("✅ Current user data:")
  console.log(`   Name: ${updatedUserData.name || "N/A"}`)
  console.log(`   Username: ${updatedUserData.username || "N/A"}`)
  console.log(`   Notification Channel: ${updatedUserData.notification_channel || "N/A"}`)
  console.log(`   Telegram Chat ID: ${updatedUserData.telegram_chat_id || "N/A"}\n`)

  console.log("✨ FIX COMPLETE")
}

// Run the function
fixUserNotificationChannel().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
