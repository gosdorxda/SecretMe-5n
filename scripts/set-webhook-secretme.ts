// Script khusus untuk mengatur webhook Telegram ke domain secretme.site
// Jalankan dengan: npx tsx scripts/set-webhook-secretme.ts

import { getTelegramApiUrl } from "../lib/telegram/config"

async function setupSecretMeWebhook() {
  const DOMAIN = "https://secretme.site"
  const WEBHOOK_URL = `${DOMAIN}/api/telegram/webhook`

  console.log(`Mengatur webhook ke: ${WEBHOOK_URL}`)

  try {
    // Hapus webhook yang ada
    const deleteResponse = await fetch(getTelegramApiUrl("deleteWebhook"))
    const deleteData = await deleteResponse.json()
    console.log("Respons hapus webhook:", deleteData)

    // Atur webhook baru
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
    console.log("Respons atur webhook:", data)

    if (data.ok) {
      console.log("✅ Webhook berhasil diatur ke secretme.site!")
    } else {
      console.error("❌ Pengaturan webhook gagal:", data.description)
    }

    // Dapatkan info webhook untuk verifikasi
    const infoResponse = await fetch(getTelegramApiUrl("getWebhookInfo"))
    const infoData = await infoResponse.json()
    console.log("Info webhook:", infoData)
  } catch (error) {
    console.error("Error saat mengatur webhook:", error)
  }
}

setupSecretMeWebhook()
