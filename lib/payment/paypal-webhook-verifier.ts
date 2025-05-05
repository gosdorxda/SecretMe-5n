import crypto from "crypto"
import { createPaymentLogger } from "./payment-logger"

export async function verifyPayPalWebhookSignature(
  requestBody: string,
  headers: Record<string, string>,
  webhookId: string,
): Promise<boolean> {
  const logger = createPaymentLogger("paypal-webhook-verify")

  try {
    // Extract PayPal signature headers
    const transmissionId = headers["paypal-transmission-id"]
    const timestamp = headers["paypal-transmission-time"]
    const webhookSignature = headers["paypal-transmission-sig"]
    const certUrl = headers["paypal-cert-url"]

    if (!transmissionId || !timestamp || !webhookSignature || !certUrl) {
      logger.error("Missing required PayPal signature headers", {
        transmissionId: !!transmissionId,
        timestamp: !!timestamp,
        webhookSignature: !!webhookSignature,
        certUrl: !!certUrl,
      })
      return false
    }

    // Validate cert URL is from PayPal
    const validPayPalHosts = ["api.paypal.com", "api.sandbox.paypal.com"]

    const certUrlObj = new URL(certUrl)
    if (!validPayPalHosts.includes(certUrlObj.hostname)) {
      logger.error("Invalid PayPal cert URL hostname", {
        certUrl,
        hostname: certUrlObj.hostname,
      })
      return false
    }

    // Fetch PayPal certificate
    const certResponse = await fetch(certUrl)
    if (!certResponse.ok) {
      logger.error("Failed to fetch PayPal certificate", {
        status: certResponse.status,
        statusText: certResponse.statusText,
      })
      return false
    }

    const cert = await certResponse.text()

    // Create the webhook event body string for verification
    const verificationMessage = `${transmissionId}|${timestamp}|${webhookId}|${crypto.createHash("sha256").update(requestBody).digest("hex")}`

    // Verify the signature
    const verify = crypto.createVerify("sha256")
    verify.update(verificationMessage)
    verify.end()

    const isVerified = verify.verify(cert, webhookSignature, "base64")

    logger.info("PayPal webhook signature verification result", {
      isVerified,
      transmissionId,
    })

    return isVerified
  } catch (error) {
    logger.error("Error verifying PayPal webhook signature", error)
    return false
  }
}
