import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createPaymentGateway } from "@/lib/payment/gateway-factory"
import { logTransaction } from "@/lib/payment/logger"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { method, amount, customerName, customerEmail, customerPhone } = body

    if (!method || !amount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Hanya menggunakan TriPay
    const gateway = createPaymentGateway("tripay")

    // Generate reference ID
    const reference = `TRX-${Date.now()}-${uuidv4().substring(0, 8)}`

    // Buat transaksi di gateway pembayaran
    const transaction = await gateway.createTransaction({
      method,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      reference,
      userId: session.user.id,
    })

    // Simpan transaksi ke database
    const { error } = await supabase.from("premium_transactions").insert({
      user_id: session.user.id,
      reference: transaction.reference,
      amount: amount,
      payment_method: method,
      status: "pending",
      gateway: "tripay",
      payment_url: transaction.paymentUrl,
      payment_details: transaction.details || {},
    })

    if (error) {
      console.error("Error saving transaction to database:", error)
      return NextResponse.json({ message: "Failed to save transaction" }, { status: 500 })
    }

    // Log transaksi
    await logTransaction({
      type: "create",
      gateway: "tripay",
      reference: transaction.reference,
      userId: session.user.id,
      amount,
      method,
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      reference: transaction.reference,
      paymentUrl: transaction.paymentUrl,
      details: transaction.details,
    })
  } catch (error: any) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ message: error.message || "Failed to create transaction" }, { status: 500 })
  }
}
