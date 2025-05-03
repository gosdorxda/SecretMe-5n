import { type NextRequest, NextResponse } from "next/server"
import { createPaymentLogger } from "@/lib/payment/logger"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const logger = createPaymentLogger("signature-debug-specific")
  logger.info("Starting specific signature debugging for TriPay")

  try {
    // Parse request body
    const body = await request.json()
    const { payload, signature, privateKey } = body

    if (!payload || !signature || !privateKey) {
      return NextResponse.json({ error: "Payload, signature, and privateKey are required" }, { status: 400 })
    }

    // Extract key fields from payload
    const reference = payload.reference
    const merchantRef = payload.merchant_ref
    const status = payload.status
    const paidAt = payload.paid_at
    const totalAmount = payload.total_amount

    // Log received data
    logger.info("Received data for signature validation", {
      reference,
      merchantRef,
      status,
      paidAt,
      totalAmount,
      signatureLength: signature.length,
      privateKeyLength: privateKey.length,
    })

    // Define specific formats to test based on TriPay documentation and common patterns
    const formats = {
      // Format 1: reference + merchantRef + status
      reference_merchantRef_status: `${reference}${merchantRef}${status}`,

      // Format 2: reference + merchantRef
      reference_merchantRef: `${reference}${merchantRef}`,

      // Format 3: reference only
      reference_only: `${reference}`,

      // Format 4: merchantRef only
      merchantRef_only: `${merchantRef}`,

      // Format 5: reference + status
      reference_status: `${reference}${status}`,

      // Format 6: merchantRef + status
      merchantRef_status: `${merchantRef}${status}`,

      // Format 7: reference + totalAmount
      reference_totalAmount: `${reference}${totalAmount}`,

      // Format 8: merchantRef + totalAmount
      merchantRef_totalAmount: `${merchantRef}${totalAmount}`,

      // Format 9: reference + merchantRef + totalAmount
      reference_merchantRef_totalAmount: `${reference}${merchantRef}${totalAmount}`,

      // Format 10: reference + paidAt
      reference_paidAt: `${reference}${paidAt}`,

      // Format 11: merchantRef + paidAt
      merchantRef_paidAt: `${merchantRef}${paidAt}`,

      // Format 12: reference + paidAt + status
      reference_paidAt_status: `${reference}${paidAt}${status}`,

      // Format 13: merchantRef + paidAt + status
      merchantRef_paidAt_status: `${merchantRef}${paidAt}${status}`,

      // Format 14: Raw JSON
      raw_json: JSON.stringify(payload),

      // Format 15: Compact JSON (no spaces)
      compact_json: JSON.stringify(payload, null, 0),
    }

    // Test each format
    const results = {}
    let matchFound = false
    let matchedFormat = null

    for (const [formatName, data] of Object.entries(formats)) {
      const calculatedSignature = crypto.createHmac("sha256", privateKey).update(data).digest("hex")
      const matches = calculatedSignature.toLowerCase() === signature.toLowerCase()

      results[formatName] = {
        data: data.length > 30 ? data.substring(0, 30) + "..." : data,
        dataLength: data.length,
        calculatedSignature: calculatedSignature,
        matches: matches,
      }

      if (matches) {
        matchFound = true
        matchedFormat = formatName
        logger.info(`Match found with format: ${formatName}`, {
          data: data.length > 50 ? data.substring(0, 50) + "..." : data,
          signature: calculatedSignature,
        })
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      matchFound,
      matchedFormat,
      results,
      receivedSignature: signature,
      payload: {
        reference,
        merchantRef,
        status,
        paidAt,
        totalAmount,
      },
    })
  } catch (error: any) {
    logger.error("Error debugging signature", error)
    return NextResponse.json({ error: "Failed to debug signature", message: error.message }, { status: 500 })
  }
}
