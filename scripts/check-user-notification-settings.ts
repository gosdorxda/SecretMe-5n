// Script untuk memeriksa pengaturan notifikasi pengguna
// Jalankan dengan: npx tsx scripts/check-user-notification-settings.ts USER_ID

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkUserNotificationSettings() {
  try {
    const userId = process.argv[2]

    if (!userId) {
      console.error("Please provide a user ID")
      console.log("Usage: npx tsx scripts/check-user-notification-settings.ts USER_ID")
      process.exit(1)
    }

    console.log(`Checking notification settings for user: ${userId}`)

    // Ambil data user
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      console.error("User not found")
      process.exit(1)
    }

    console.log("\n=== User Information ===")
    console.log(`ID: ${userData.id}`)
    console.log(`Name: ${userData.name}`)
    console.log(`Username: ${userData.username}`)
    console.log(`Email: ${userData.email}`)

    console.log("\n=== Notification Settings ===")
    console.log(`Notification Channel: ${userData.notification_channel || "Not set"}`)
    console.log(`Telegram Chat ID: ${userData.telegram_chat_id || "Not set"}`)
    console.log(`WhatsApp Notifications: ${userData.whatsapp_notifications_enabled ? "Enabled" : "Disabled"}`)
    console.log(`WhatsApp Number: ${userData.whatsapp_number || "Not set"}`)
    console.log(`Email Notifications: ${userData.email_notifications_enabled ? "Enabled" : "Disabled"}`)

    // Periksa status notifikasi Telegram
    if (userData.notification_channel === "telegram" && userData.telegram_chat_id) {
      console.log("\n✅ Telegram notifications are properly configured")
    } else if (userData.telegram_chat_id && userData.notification_channel !== "telegram") {
      console.log("\n⚠️ Telegram chat ID is set but notification channel is not set to 'telegram'")
      console.log("   Consider updating notification_channel to 'telegram'")
    } else if (!userData.telegram_chat_id && userData.notification_channel === "telegram") {
      console.log("\n⚠️ Notification channel is set to 'telegram' but Telegram chat ID is not set")
      console.log("   User needs to verify with the Telegram bot")
    } else {
      console.log("\n❌ Telegram notifications are not configured")
    }

    // Periksa log notifikasi terakhir
    const { data: notificationLogs, error: logsError } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    if (logsError) {
      console.error("\nError fetching notification logs:", logsError)
    } else if (notificationLogs && notificationLogs.length > 0) {
      console.log("\n=== Recent Notification Logs ===")
      notificationLogs.forEach((log, index) => {
        console.log(`\nLog #${index + 1}:`)
        console.log(`Type: ${log.notification_type}`)
        console.log(`Channel: ${log.channel}`)
        console.log(`Status: ${log.status}`)
        console.log(`Created At: ${new Date(log.created_at).toLocaleString()}`)
        if (log.error_message) {
          console.log(`Error: ${log.error_message}`)
        }
      })
    } else {
      console.log("\nNo notification logs found")
    }
  } catch (error) {
    console.error("Error checking user notification settings:", error)
  }
}

checkUserNotificationSettings()
