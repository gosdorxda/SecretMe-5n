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

    // Verifikasi pengguna dengan getUser()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error verifying user:", userError)
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    console.log("User authenticated:", user.id)

    // Generate a 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("Generated code:", code)

    // Store the connection code in the database with expiration time (30 minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // Insert or update the connection code
    // Perhatikan: menggunakan is_used, bukan used
    const { error } = await supabase.from("telegram_connection_codes").upsert({
      id: randomUUID(),
      user_id: user.id, // Gunakan user.id yang terverifikasi
      code: code,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      is_used: false, // Menggunakan is_used, bukan used
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
