import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "@/lib/payment/logger"

export async function POST(request: NextRequest) {
  const logger = createPaymentLogger("paypal-ipn")
  logger.info("Received PayPal IPN notification")

  try {
    // 1. Ambil data dari request
    const formData = await request.formData()
    const payload: Record<string, string> = {}

    for (const [key, value] of formData.entries()) {
      payload[key] = value.toString()
    }

    logger.debug("IPN payload received", { payload })

    // 2. Verifikasi dengan PayPal
    const verificationResult = await verifyIPN(payload)

    if (!verificationResult.verified) {
      logger.error("IPN verification failed", null, { response: verificationResult.response })
      return NextResponse.json({ error: "IPN verification failed" }, { status: 400 })
    }

    logger.info("IPN verification successful")

    // 3. Proses pembayaran
    const { txn_id, payment_status, custom, mc_gross, payment_date, payer_email } = payload

    // 'custom' field berisi user_id yang kita sertakan saat membuat Pay Link
    const userId = custom

    if (!userId) {
      logger.error("No user ID found in IPN payload")
      return NextResponse.json({ error: "No user ID found" }, { status: 400 })
    }

    // 4. Update database
    const supabase = createClient()

    // Cek apakah transaksi sudah ada
    const { data: existingTx } = await supabase
      .from("premium_transactions")
      .select("id")
      .eq("payment_details->txn_id", txn_id)
      .single()

    if (existingTx) {
      logger.info("Transaction already processed", { txn_id })
      return NextResponse.json({ success: true, message: "Transaction already processed" })
    }

    // Buat transaksi baru
    const { data: transaction, error } = await supabase
      .from("premium_transactions")
      .insert({
        user_id: userId,
        plan_id: `PAYPAL-${txn_id}`,
        amount: Number.parseFloat(mc_gross),
        status: payment_status === "Completed" ? "success" : "pending",
        payment_method: "PayPal",
        payment_gateway: "paypal",
        payment_details: {
          txn_id,
          payment_status,
          payment_date,
          payer_email,
          ...payload,
        },
      })
      .select()
      .single()

    if (error) {
      logger.error("Failed to create transaction record", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    logger.info("Transaction record created", { transactionId: transaction.id })

    // Jika pembayaran sukses, update status premium user
    if (payment_status === "Completed") {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: null, // Lifetime premium
        })
        .eq("id", userId)

      if (userUpdateError) {
        logger.error("Failed to update user premium status", userUpdateError)
      } else {
        logger.info("User upgraded to premium", { userId })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error processing PayPal IPN", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Fungsi untuk verifikasi IPN dengan PayPal
async function verifyIPN(payload: Record<string, string>): Promise<{ verified: boolean; response: string }> {
  const logger = createPaymentLogger("paypal-ipn-verify")

  // Tambahkan cmd=_notify-validate ke payload
  const verificationPayload = new URLSearchParams({ cmd: "_notify-validate" })

  // Tambahkan semua field asli ke payload verifikasi
  Object.entries(payload).forEach(([key, value]) => {
    verificationPayload.append(key, value)
  })

  // Tentukan URL berdasarkan mode (sandbox atau production)
  const paypalUrl =
    process.env.PAYPAL_USE_PRODUCTION === "true"
      ? "https://ipnpb.paypal.com/cgi-bin/webscr"
      : "https://ipnpb.sandbox.paypal.com/cgi-bin/webscr"

  logger.debug("Verifying IPN with PayPal", { url: paypalUrl })

  // Kirim verifikasi ke PayPal
  const response = await fetch(paypalUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: verificationPayload.toString(),
  })

  const responseText = await response.text()
  logger.debug("PayPal verification response", { response: responseText })

  // PayPal akan merespon dengan "VERIFIED" jika valid
  return {
    verified: responseText === "VERIFIED",
    response: responseText,
  }
}
