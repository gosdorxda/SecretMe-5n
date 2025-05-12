import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("Verify connection endpoint called")

    // Get request body
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 })
    }

    console.log("Verifying code:", code)

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

    // Check if the code exists and is valid
    const { data: codeData, error: codeError } = await supabase
      .from("telegram_connection_codes")
      .select("*")
      .eq("code", code)
      .eq("user_id", session.user.id)
      .eq("is_used", false) // Menggunakan is_used, bukan used
      .gt("expires_at", new Date().toISOString())
      .single()

    if (codeError || !codeData) {
      console.log("Code not found or invalid:", codeError)
      return NextResponse.json(
        {
          success: false,
          error: "Kode tidak valid atau sudah kadaluarsa. Silakan buat kode baru.",
        },
        { status: 400 },
      )
    }

    console.log("Valid code found:", codeData.id)

    // Get the telegram_id from the bot database or service
    // This is a placeholder - in a real implementation, you would check if the bot
    // has received this code and get the associated telegram_id
    const telegramId = "123456789" // Placeholder

    // Update the user's telegram_id
    const { error: updateError } = await supabase
      .from("users")
      .update({
        telegram_id: telegramId,
        telegram_notifications: true,
      })
      .eq("id", session.user.id)

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update user: " + updateError.message },
        { status: 500 },
      )
    }

    // Mark the code as used
    const { error: markUsedError } = await supabase
      .from("telegram_connection_codes")
      .update({ is_used: true }) // Menggunakan is_used, bukan used
      .eq("id", codeData.id)

    if (markUsedError) {
      console.error("Error marking code as used:", markUsedError)
      // We don't return an error here as the main operation succeeded
    }

    console.log("User telegram_id updated successfully")

    return NextResponse.json({
      success: true,
      telegramId: telegramId,
    })
  } catch (error: any) {
    console.error("Error verifying connection:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to verify connection" }, { status: 500 })
  }
}
