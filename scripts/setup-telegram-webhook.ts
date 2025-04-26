// This script sets up the webhook for your Telegram bot
// Run with: npx tsx scripts/setup-telegram-webhook.ts

import { getTelegramApiUrl } from "../lib/telegram/config"

async function setupWebhook() {
  const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
    : "https://your-domain.com/api/telegram/webhook"

  console.log(`Setting up webhook to: ${WEBHOOK_URL}`)

  try {
    // First, delete any existing webhook
    const deleteResponse = await fetch(getTelegramApiUrl("deleteWebhook"))
    const deleteData = await deleteResponse.json()

    console.log("Delete webhook response:", deleteData)

    // Set the new webhook
    const response = await fetch(getTelegramApiUrl("setWebhook"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ["message"],
      }),
    })

    const data = await response.json()
    console.log("Set webhook response:", data)

    if (data.ok) {
      console.log("✅ Webhook setup successful!")
    } else {
      console.error("❌ Webhook setup failed:", data.description)
    }

    // Get webhook info to verify
    const infoResponse = await fetch(getTelegramApiUrl("getWebhookInfo"))
    const infoData = await infoResponse.json()
    console.log("Webhook info:", infoData)
  } catch (error) {
    console.error("Error setting up webhook:", error)
  }
}

setupWebhook()
