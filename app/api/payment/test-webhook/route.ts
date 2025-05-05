import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaymentLogger } from "@/lib/payment/logger"

export async function GET(request: NextRequest) {
  const logger = createPaymentLogger("test-webhook")

  try {
    // Hanya izinkan di development mode
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Endpoint not available in production" }, { status: 403 })
    }

    // Dapatkan parameter dari query string
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("order_id")
    const transactionId = searchParams.get("transaction_id")

    if (!orderId && !transactionId) {
      return NextResponse.json({ error: "Missing order_id or transaction_id parameter" }, { status: 400 })
    }

    const supabase = createClient()

    // Cari transaksi berdasarkan ID atau order ID
    let transaction

    if (transactionId) {
      const { data, error } = await supabase.from("premium_transactions").select("*").eq("id", transactionId).single()

      if (error) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      transaction = data
    } else if (orderId) {
      // Coba cari dengan gateway_reference
      const { data, error } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("gateway_reference", orderId)
        .single()

      if (error) {
        // Coba cari dengan plan_id
        const { data: planData, error: planError } = await supabase
          .from("premium_transactions")
          .select("*")
          .eq("plan_id", orderId)
          .single()

        if (planError) {
          return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
        }

        transaction = planData
      } else {
        transaction = data
      }
    }

    // Buat payload webhook simulasi
    const simulatedWebhook = {
      id: `WH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      create_time: new Date().toISOString(),
      resource_type: "capture",
      resource: {
        id: `CAP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        status: "COMPLETED",
        amount: {
          currency_code: "USD",
          value: (transaction.amount / 15000).toFixed(2),
        },
        final_capture: true,
        seller_protection: {
          status: "ELIGIBLE",
          dispute_categories: ["ITEM_NOT_RECEIVED", "UNAUTHORIZED_TRANSACTION"],
        },
        links: [
          {
            href: `https://api.sandbox.paypal.com/v2/payments/captures/${transaction.gateway_reference}`,
            rel: "self",
            method: "GET",
          },
          {
            href: `https://api.sandbox.paypal.com/v2/payments/orders/${transaction.gateway_reference}`,
            rel: "up",
            method: "GET",
          },
        ],
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
      },
      links: [
        {
          href: "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-123456789",
          rel: "self",
          method: "GET",
        },
        {
          href: "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-123456789/resend",
          rel: "resend",
          method: "POST",
        },
      ],
    }

    // Log webhook simulasi
    logger.info("Generated test webhook payload", {
      transactionId: transaction.id,
      orderId: transaction.gateway_reference || transaction.plan_id,
    })

    // Kirim webhook ke endpoint webhook PayPal
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/paypal-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PayPal/AUHD-1.0-1",
        "paypal-transmission-id": `test-${Date.now()}`,
        "paypal-transmission-time": new Date().toISOString(),
        "paypal-transmission-sig": "test-signature",
        "paypal-cert-url": "https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-90621ecd",
      },
      body: JSON.stringify(simulatedWebhook),
    })

    const webhookResult = await webhookResponse.json()

    return NextResponse.json({
      success: true,
      message: "Test webhook sent",
      transaction: {
        id: transaction.id,
        status: transaction.status,
        gateway_reference: transaction.gateway_reference,
        plan_id: transaction.plan_id,
      },
      webhook: {
        status: webhookResponse.status,
        result: webhookResult,
      },
    })
  } catch (error: any) {
    logger.error("Error in test webhook endpoint", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
