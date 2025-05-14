import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Cek session dan verifikasi user
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    console.error("Error getting session:", sessionError)
    return NextResponse.json({ error: "Authentication error" }, { status: 401 })
  }

  // Verifikasi user dengan getUser()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error verifying user:", userError)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  // Verifikasi apakah user adalah admin
  const { data: adminData } = await supabase.from("users").select("email").eq("id", user.id).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  if (!adminEmails.includes(adminData?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Get base URL from environment or construct it properly
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (request.url.startsWith("https") ? new URL(request.url).origin : `https://${new URL(request.url).host}`)

    // Use absolute URL instead of relative URL
    const regenerateUrl = `${baseUrl}/api/sitemap/regenerate`

    // Make the request with proper error handling
    const response = await fetch(regenerateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: process.env.CRON_SECRET,
        triggeredBy: "admin",
        adminId: user.id,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Gagal meregenerasi sitemap" }))
      throw new Error(errorData.error || "Gagal meregenerasi sitemap")
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Sitemap telah berhasil diregenerasi",
      data,
    })
  } catch (error) {
    console.error("Error meregenerasi sitemap:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Tidak dapat meregenerasi sitemap",
      },
      { status: 500 },
    )
  }
}
