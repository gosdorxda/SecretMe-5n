// Script alternatif untuk memeriksa trigger notifikasi di database
// Jalankan dengan: npx tsx scripts/check-notification-triggers-alt.ts

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/check-notification-triggers-alt.ts",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkNotificationTriggers() {
  try {
    console.log("🔍 CHECKING NOTIFICATION TRIGGERS")
    console.log("================================\n")

    // Query untuk mendapatkan daftar trigger
    const { data: triggers, error } = await supabase.from("pg_trigger").select("*")

    // Jika tabel pg_trigger tidak ada, gunakan query SQL langsung
    if (error && error.code === "42P01") {
      // relation does not exist
      console.log("ℹ️ Using direct SQL query to check triggers\n")

      // Query SQL untuk mendapatkan trigger dari information_schema
      const { data: sqlResult, error: sqlError } = await supabase.rpc("exec_sql", {
        sql_query: `
          SELECT 
            trigger_name,
            event_object_table,
            event_manipulation,
            action_statement
          FROM 
            information_schema.triggers
          WHERE 
            trigger_schema = 'public'
          ORDER BY 
            event_object_table, trigger_name
        `,
      })

      if (sqlError) {
        // Jika rpc exec_sql tidak tersedia, berikan instruksi manual
        console.log("❌ Cannot query triggers automatically")
        console.log("Please run the following SQL query in Supabase SQL Editor:\n")
        console.log(`
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  trigger_schema = 'public'
ORDER BY 
  event_object_table, trigger_name;
        `)
        return
      }

      if (!sqlResult || sqlResult.length === 0) {
        console.log("ℹ️ No triggers found")
        return
      }

      console.log(`✅ Found ${sqlResult.length} triggers\n`)

      // Filter trigger yang terkait dengan notifikasi
      const notificationTriggers = sqlResult.filter(
        (trigger) =>
          trigger.trigger_name.includes("notif") ||
          trigger.trigger_name.includes("message") ||
          (trigger.action_statement && trigger.action_statement.includes("notification")),
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
          console.log(
            `Action: ${trigger.action_statement ? trigger.action_statement.substring(0, 200) + "..." : "N/A"}`,
          )
          console.log("")
        })
      }

      return
    }

    if (error) {
      console.error("❌ Error fetching triggers:", error)
      console.log("\nPlease run the following SQL in Supabase SQL Editor to check triggers manually:\n")
      console.log(`
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  trigger_schema = 'public'
ORDER BY 
  event_object_table, trigger_name;
      `)
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
        trigger.tgname.includes("notif") ||
        trigger.tgname.includes("message") ||
        (trigger.tgqual && trigger.tgqual.includes("notification")),
    )

    if (notificationTriggers.length === 0) {
      console.log("ℹ️ No notification-related triggers found")
    } else {
      console.log(`✅ Found ${notificationTriggers.length} notification-related triggers:\n`)

      notificationTriggers.forEach((trigger, index) => {
        console.log(`📝 TRIGGER #${index + 1}`)
        console.log(`Name: ${trigger.tgname}`)
        console.log(`Table: ${trigger.tgrelid}`)
        console.log(`Enabled: ${trigger.tgenabled === "O" ? "Yes" : "No"}`)
        console.log("")
      })
    }

    console.log("✨ CHECK COMPLETE")
  } catch (error) {
    console.error("Error checking notification triggers:", error)
    console.log("\nPlease run the following SQL in Supabase SQL Editor to check triggers manually:\n")
    console.log(`
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_statement
FROM 
  information_schema.triggers
WHERE 
  trigger_schema = 'public'
ORDER BY 
  event_object_table, trigger_name;
    `)
  }
}

checkNotificationTriggers()
