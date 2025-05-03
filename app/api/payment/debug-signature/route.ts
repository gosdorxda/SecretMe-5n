import { type NextRequest, NextResponse } from "next/server"
import { getPaymentGateway } from "@/lib/payment/gateway-factory"
import { createPaymentLogger } from "@/lib/payment/logger"

export async function POST(request: NextRequest) {
  const logger = createPaymentLogger("signature-debug")
  logger.info("Starting signature debugging")

  try {
    // Parse request body
    const body = await request.json()
    const { payload, signature } = body

    if (!payload || !signature) {
      return NextResponse.json({ error: "Payload and signature are required" }, { status: 400 })
    }

    // Get TriPay gateway
    const gateway = (await getPaymentGateway("tripay")) as any

    // Call debug method
    const result = await gateway.debugSignature(payload, signature)

    return NextResponse.json({
      success: true,
      debug: result,
    })
  } catch (error: any) {
    logger.error("Error debugging signature", error)
    return NextResponse.json({ error: "Failed to debug signature", message: error.message }, { status: 500 })
  }
}
