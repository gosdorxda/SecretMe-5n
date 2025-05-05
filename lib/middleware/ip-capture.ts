import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function captureUserIp(req: NextRequest) {
  try {
    // Get IP address from request
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    // Get user from session
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Update user's last_ip
      await supabase.from("users").update({ last_ip: ip }).eq("id", user.id)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Error capturing IP:", error)
    // Continue even if IP capture fails
    return NextResponse.next()
  }
}
