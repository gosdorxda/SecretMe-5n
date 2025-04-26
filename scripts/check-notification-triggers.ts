// Script untuk memeriksa trigger notifikasi di database
// Jalankan dengan: npx tsx scripts/check-notification-triggers.ts

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/check-notification-triggers.ts",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkNotificationTriggers() {
  try {
    console.log("🔍 CHECKING NOTIFICATION TRIGGERS")
    console.log("================================\n")

    // Periksa trigger pada tabel messages
    const { data: triggers, error } = await supabase.rpc("get_triggers")

    if (error) {
      console.error("❌ Error fetching triggers:", error)
      return
    }

    if (!triggers || triggers.length === 0) {
      console.log("ℹ️ No triggers found")
      return
    }

    console.log(`✅ Found ${triggers.length} triggers\n`)

    // Filter trigger yang terkait dengan notifikasi
    const notificationTriggers = triggers.filter(
      (trigger) =>
        trigger.trigger_name.includes("notif") ||
        trigger.trigger_name.includes("message") ||
        trigger.action_statement.includes("notification"),
    )

    if (notificationTriggers.length === 0) {
      console.log("ℹ️ No notification-related triggers found")
    } else {
      console.log(`✅ Found ${notificationTriggers.length} notification-related triggers:\n`)

      notificationTriggers.forEach((trigger, index) => {
        console.log(`📝 TRIGGER #${index + 1}`)
        console.log(`Name: ${trigger.trigger_name}`)
        console.log(`Table: ${trigger.event_object_table}`)
        console.log(`Event: ${trigger.event_manipulation}`)
        console.log(`Action: ${trigger.action_statement}`)
        console.log("")
      })
    }

    console.log("✨ CHECK COMPLETE")
  } catch (error) {
    console.error("Error checking notification triggers:", error)
  }
}

checkNotificationTriggers()
