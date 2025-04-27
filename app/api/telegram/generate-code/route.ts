import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // Get user session
    const supabase = createClient(cookies())
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Generate a 6-digit numeric code
    const connectionCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store the connection code in the database with expiration time (30 minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    const { error } = await supabase.from("telegram_connection_codes").upsert({
      user_id: session.user.id,
      code: connectionCode,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error storing connection code:", error)
      return NextResponse.json({ success: false, error: "Failed to generate connection code" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      connectionCode,
    })
  } catch (error: any) {
    console.error("Error generating connection code:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate connection code" },
      { status: 500 },
    )
  }
}
