// Script untuk memperbaiki alur notifikasi
// Jalankan dengan: npx tsx scripts/fix-notification-flow.ts user_id

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/fix-notification-flow.ts user_id",
  )
  process.exit(1)
}

// Ambil user ID dari argumen command line
const userId = process.argv[2]

if (!userId) {
  console.error("Please provide a user ID")
  console.error("Usage: npx tsx scripts/fix-notification-flow.ts user_id")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function fixNotificationFlow() {
  try {
    console.log("🔧 FIXING NOTIFICATION FLOW")
    console.log("===========================\n")

    console.log(`Checking user data for ID: ${userId}`)

    // Periksa data pengguna
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error("❌ Error fetching user data:", userError)
      return
    }

    if (!user) {
      console.error("❌ User not found")
      return
    }

    console.log("✅ User found:")
    console.log(`   Name: ${user.name}`)
    console.log(`   Username: ${user.username || "N/A"}`)
    console.log(`   Notification Channel: ${user.notification_channel || "N/A"}`)
    console.log(`   Telegram Chat ID: ${user.telegram_chat_id || "N/A"}`)
    console.log("")

    // Periksa notifikasi dengan status pending
    console.log("Checking pending notifications...")

    const { data: pendingNotifications, error: pendingError } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (pendingError) {
      console.error("❌ Error fetching pending notifications:", pendingError)
      return
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log("✅ No pending notifications found")
    } else {
      console.log(`ℹ️ Found ${pendingNotifications.length} pending notifications`)
      console.log("Updating pending notifications to 'cancelled'...")

      // Update semua notifikasi pending menjadi cancelled
      const { error: updateError } = await supabase
        .from("notification_logs")
        .update({ status: "cancelled", error_message: "Cancelled by fix script" })
        .eq("user_id", userId)
        .eq("status", "pending")

      if (updateError) {
        console.error("❌ Error updating pending notifications:", updateError)
      } else {
        console.log("✅ Pending notifications updated to 'cancelled'")
      }
    }

    // Periksa dan perbarui notification_channel jika perlu
    if (!user.notification_channel || user.notification_channel !== "telegram") {
      console.log("Updating notification_channel to 'telegram'...")

      const { error: updateChannelError } = await supabase
        .from("users")
        .update({ notification_channel: "telegram" })
        .eq("id", userId)

      if (updateChannelError) {
        console.error("❌ Error updating notification_channel:", updateChannelError)
      } else {
        console.log("✅ Notification channel updated to 'telegram'")
      }
    } else {
      console.log("✅ Notification channel already set to 'telegram'")
    }

    // Periksa dan perbarui telegram_chat_id jika perlu
    if (!user.telegram_chat_id) {
      console.log("❌ User does not have a Telegram chat ID")
      console.log("Please connect Telegram first")
    } else {
      console.log("✅ Telegram chat ID is already set")
    }

    console.log("\n✨ FIX COMPLETE")
  } catch (error) {
    console.error("Error fixing notification flow:", error)
  }
}

fixNotificationFlow()
