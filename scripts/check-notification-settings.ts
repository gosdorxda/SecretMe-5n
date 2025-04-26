// Script untuk memeriksa pengaturan notifikasi pengguna
// Jalankan dengan: npx tsx scripts/check-notification-settings.ts <user_id>

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

async function checkNotificationSettings(userId?: string) {
  try {
    console.log("Memeriksa pengaturan notifikasi...\n")

    let query = supabase
      .from("users")
      .select("id, name, username, notification_channel, telegram_chat_id, phone_number, whatsapp_notifications")

    if (userId) {
      query = query.eq("id", userId)
    }

    const { data: users, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return
    }

    if (!users || users.length === 0) {
      console.log("Tidak ada pengguna yang ditemukan")
      return
    }

    console.log(`Ditemukan ${users.length} pengguna\n`)

    for (const user of users) {
      console.log(`User: ${user.name || "Unnamed"} (${user.username || "No username"})`)
      console.log(`ID: ${user.id}`)
      console.log(`Channel Notifikasi: ${user.notification_channel || "Tidak diatur"}`)

      if (user.notification_channel === "telegram") {
        console.log(`Telegram Chat ID: ${user.telegram_chat_id || "Tidak diatur"}`)

        if (user.telegram_chat_id) {
          console.log("Status Telegram: ✅ Terhubung")
        } else {
          console.log("Status Telegram: ❌ Tidak terhubung (Chat ID tidak ada)")
        }
      } else if (user.notification_channel === "whatsapp") {
        console.log(`Nomor Telepon: ${user.phone_number || "Tidak diatur"}`)
        console.log(`WhatsApp Notifications: ${user.whatsapp_notifications ? "✅ Aktif" : "❌ Tidak aktif"}`)
      } else {
        console.log("Status Telegram: ❌ Tidak terhubung (Channel bukan Telegram)")
        console.log(`Telegram Chat ID: ${user.telegram_chat_id || "Tidak diatur"}`)
      }

      console.log("-----------------------------------")
    }

    // Periksa log notifikasi terbaru
    if (userId) {
      const { data: logs, error: logsError } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (logsError) {
        console.error("Error fetching notification logs:", logsError)
        return
      }

      if (logs && logs.length > 0) {
        console.log("\nLog Notifikasi Terbaru:")

        for (const log of logs) {
          console.log(`ID: ${log.id}`)
          console.log(`Tipe: ${log.notification_type}`)
          console.log(`Channel: ${log.channel}`)
          console.log(`Status: ${log.status}`)
          console.log(`Waktu: ${new Date(log.created_at).toLocaleString()}`)

          if (log.error_message) {
            console.log(`Error: ${log.error_message}`)
          }

          console.log("-----------------------------------")
        }
      } else {
        console.log("\nTidak ada log notifikasi")
      }
    }
  } catch (error) {
    console.error("Error checking notification settings:", error)
  }
}

// Get user ID from command line arguments
const userId = process.argv[2]

if (userId) {
  console.log(`Memeriksa pengaturan notifikasi untuk user ID: ${userId}`)
  checkNotificationSettings(userId)
} else {
  console.log("Memeriksa pengaturan notifikasi untuk semua pengguna")
  checkNotificationSettings()
}
