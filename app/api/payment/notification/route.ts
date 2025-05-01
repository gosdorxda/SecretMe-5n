import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createPaymentGateway } from "@/lib/payment/gateway-factory"
import { logTransaction } from "@/lib/payment/logger"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Hanya menggunakan TriPay
    const gateway = createPaymentGateway("tripay")

    // Verifikasi callback
    const body = await request.text()
    const signature = request.headers.get("X-Callback-Signature") || ""
    const event = request.headers.get("X-Callback-Event") || ""

    const isValid = await gateway.verifyCallback(body, signature, event)

    if (!isValid) {
      console.error("Invalid callback signature")
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 })
    }

    // Parse data
    const data = JSON.parse(body)
    const { reference, status } = await gateway.parseCallback(data)

    if (!reference) {
      console.error("Missing reference in callback data")
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 })
    }

    // Log notifikasi
    await supabase.from("payment_notification_logs").insert({
      gateway: "tripay",
      reference,
      payload: data,
      status: status,
    })

    // Update status transaksi
    const { data: transaction, error: fetchError } = await supabase
      .from("premium_transactions")
      .select("user_id, status")
      .eq("reference", reference)
      .single()

    if (fetchError || !transaction) {
      console.error("Transaction not found:", reference)
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 })
    }

    // Jika status sudah completed, jangan update lagi
    if (transaction.status === "completed") {
      return NextResponse.json({ success: true, message: "Transaction already completed" })
    }

    // Update status transaksi
    const { error: updateError } = await supabase
      .from("premium_transactions")
      .update({ status: status })
      .eq("reference", reference)

    if (updateError) {
      console.error("Error updating transaction:", updateError)
      return NextResponse.json({ success: false, message: "Failed to update transaction" }, { status: 500 })
    }

    // Jika pembayaran berhasil, update status premium user
    if (status === "completed" || status === "paid") {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
        })
        .eq("id", transaction.user_id)

      if (userUpdateError) {
        console.error("Error updating user premium status:", userUpdateError)
      }
    }

    // Log transaksi
    await logTransaction({
      type: "notification",
      gateway: "tripay",
      reference,
      userId: transaction.user_id,
      status: status,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error processing payment notification:", error)
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
