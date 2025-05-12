import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { randomUUID } from "crypto"

export async function POST(request: Request) {
  try {
    console.log("Generate code endpoint called")

    // Get user session
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated:", session.user.id)

    // Generate a 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("Generated code:", code)

    // Store the connection code in the database with expiration time (30 minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // Check if telegram_connection_codes table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("telegram_connection_codes")
      .select("*")
      .limit(1)
      .maybeSingle()

    if (tableCheckError) {
      console.log("Error checking table existence:", tableCheckError)

      // If table doesn't exist, create it
      if (tableCheckError.message.includes("does not exist")) {
        console.log("Creating telegram_connection_codes table")

        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS telegram_connection_codes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id),
            code TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN DEFAULT FALSE
          );
        `

        const { error: createError } = await supabase.rpc("exec", { query: createTableQuery })

        if (createError) {
          console.log("Error creating table:", createError)
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create connection codes table",
            },
            { status: 500 },
          )
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to check connection codes table",
          },
          { status: 500 },
        )
      }
    }

    // Insert or update the connection code
    const { error } = await supabase.from("telegram_connection_codes").upsert({
      id: randomUUID(),
      user_id: session.user.id,
      code: code,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      used: false,
    })

    if (error) {
      console.error("Error storing connection code:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate connection code: " + error.message,
        },
        { status: 500 },
      )
    }

    console.log("Code stored successfully")
    return NextResponse.json({
      success: true,
      code: code,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Error generating connection code:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate connection code: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    )
  }
}
