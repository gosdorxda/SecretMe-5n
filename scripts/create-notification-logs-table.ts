// Script untuk membuat tabel notification_logs
// Jalankan dengan: npx tsx scripts/create-notification-logs-table.ts

import { createClient } from "@supabase/supabase-js"

// Ambil environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables")
  console.error(
    "Run with: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/create-notification-logs-table.ts",
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function createNotificationLogsTable() {
  try {
    console.log("🔧 CREATING NOTIFICATION LOGS TABLE")
    console.log("=================================\n")

    // Periksa apakah tabel sudah ada
    const { count, error: countError } = await supabase
      .from("notification_logs")
      .select("*", { count: "exact", head: true })

    if (!countError) {
      console.log("✅ notification_logs table already exists")
      return
    }

    // Buat tabel notification_logs
    const { error } = await supabase.rpc("create_notification_logs_table")

    if (error) {
      // Jika RPC tidak tersedia, buat tabel dengan SQL langsung
      console.log("ℹ️ RPC not available, creating table with direct SQL")

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS notification_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          message_id UUID,
          notification_type TEXT NOT NULL,
          channel TEXT NOT NULL,
          status TEXT NOT NULL,
          error_message TEXT,
          data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
      `

      const { error: sqlError } = await supabase.rpc("run_sql", { sql: createTableSQL })

      if (sqlError) {
        console.error("❌ Error creating notification_logs table:", sqlError)
        console.log("\n⚠️ You need to create the table manually using SQL:")
        console.log(createTableSQL)
        return
      }
    }

    console.log("✅ notification_logs table created successfully")
  } catch (error) {
    console.error("Error creating notification_logs table:", error)
  }
}

createNotificationLogsTable()
