import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateOrderId, getMidtransSnapApiUrl, MIDTRANS_CONFIG, getMidtransAuthHeader } from "@/lib/midtrans"

export async function POST(request: NextRequest) {
  try {
    // Verifikasi user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ambil data user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name, email, is_premium")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Cek apakah user sudah premium
    if (userData.is_premium) {
      return NextResponse.json({ error: "User already premium" }, { status: 400 })
    }

    // Generate order ID
    const orderId = generateOrderId(user.id)

    // Buat transaksi di database
    const { error: transactionError } = await supabase.from("premium_transactions").insert({
      user_id: user.id,
      plan_id: orderId,
      amount: MIDTRANS_CONFIG.premiumPrice,
      status: "pending",
    })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
    }

    // Buat transaksi di Midtrans menggunakan Snap API
    const snapApiUrl = getMidtransSnapApiUrl()
    console.log("Using Midtrans Snap API URL:", snapApiUrl)
    console.log("Server Key (first 4 chars):", MIDTRANS_CONFIG.serverKey.substring(0, 4))

    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: MIDTRANS_CONFIG.premiumPrice,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: userData.name || "User",
        email: userData.email,
      },
      item_details: [
        {
          id: "premium-lifetime",
          price: MIDTRANS_CONFIG.premiumPrice,
          quantity: 1,
          name: "SecretMe Premium Lifetime",
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL}/premium?status=error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=pending`,
      },
    }

    // Dapatkan header auth yang benar
    const authHeader = getMidtransAuthHeader()

    // Log request untuk debugging
    console.log("Sending request to Midtrans:", {
      url: snapApiUrl,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader.substring(0, 20) + "...", // Log partial auth for security
      },
    })

    const midtransResponse = await fetch(snapApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(transactionDetails),
    })

    // Log response status untuk debugging
    console.log("Midtrans response status:", midtransResponse.status)

    if (!midtransResponse.ok) {
      const errorData = (await midtransResponse.json().catch(() => null)) || (await midtransResponse.text())
      console.error("Midtrans error:", errorData)

      // Hapus transaksi dari database karena gagal
      await supabase.from("premium_transactions").delete().eq("plan_id", orderId)

      return NextResponse.json(
        {
          error: "Failed to create Midtrans transaction",
          details: typeof errorData === "string" ? errorData.substring(0, 200) : errorData,
        },
        { status: 500 },
      )
    }

    const midtransData = await midtransResponse.json()
    console.log("Midtrans response data:", midtransData)

    return NextResponse.json({
      success: true,
      token: midtransData.token,
      redirect_url: midtransData.redirect_url,
    })
  } catch (error: any) {
    console.error("Error in create transaction:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
