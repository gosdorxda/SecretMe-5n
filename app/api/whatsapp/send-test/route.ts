import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("[SERVER] API route /api/whatsapp/send-test called")

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Cek session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("[SERVER] Unauthorized: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verifikasi user dengan getUser() yang lebih aman
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[SERVER] Unauthorized: Invalid user", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    console.log("[SERVER] Request body:", body)

    const { phoneNumber } = body

    if (!phoneNumber) {
      console.log("[SERVER] Missing required fields:", { phoneNumber })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[SERVER] Sending test message to:", phoneNumber)

    // Kirim pesan test via WhatsApp menggunakan API Fonnte langsung
    const apiUrl = "https://api.fonnte.com/send"

    // Format body request sesuai dokumentasi Fonnte
    const requestBody = {
      target: phoneNumber,
      message: `Ini adalah pesan test dari SecretMe. Jika Anda menerima pesan ini, berarti notifikasi WhatsApp berfungsi dengan baik.`,
    }

    console.log("[SERVER] Sending request to Fonnte API:", requestBody)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseData = await response.json()
    console.log("[SERVER] Fonnte API response:", responseData)

    // Cek status dari response Fonnte
    if (!responseData.status) {
      console.error("[SERVER] Fonnte API error:", responseData)
      return NextResponse.json(
        {
          error: `Fonnte API error: ${responseData.reason || "Unknown error"}`,
          details: responseData,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test message sent successfully",
      details: responseData,
    })
  } catch (error: any) {
    console.error("[SERVER] Error in send-test route:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
