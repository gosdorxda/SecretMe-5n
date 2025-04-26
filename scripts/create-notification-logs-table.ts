import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

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
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createNotificationLogsTable() {
  console.log("🔧 CREATING NOTIFICATION_LOGS TABLE")
  console.log("==================================\n")

  try {
    // Check if table already exists
    const { data: testData, error: testError } = await supabase.from("notification_logs").select("id").limit(1)

    if (!testError) {
      console.log("✅ notification_logs table already exists")
      return
    }

    if (testError.code !== "42P01") {
      // If error is not "table doesn't exist"
      console.error("❌ Unexpected error checking table:", testError)
      return
    }

    // Create table using raw SQL
    const { error: createError } = await supabase.rpc("exec", {
      query: `
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
      `,
    })

    if (createError) {
      console.error("❌ Error creating table:", createError)

      // Try alternative approach if rpc fails
      console.log("Trying alternative approach...")

      // Execute SQL directly using REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          query: `
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
          `,
        }),
      })

      if (!response.ok) {
        console.error("❌ Alternative approach failed:", await response.text())
        console.log("\n⚠️ Please run the following SQL in the Supabase SQL Editor:")
        console.log(`
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
        `)
        return
      }
    }

    console.log("✅ notification_logs table created successfully")
  } catch (error) {
    console.error("Error:", error)
  }
}

// Run the function
createNotificationLogsTable()
