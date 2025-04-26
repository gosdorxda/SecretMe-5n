// Script untuk memperbarui URL webhook Telegram secara manual
// Jalankan dengan: npx tsx scripts/update-telegram-webhook.ts https://your-domain.com

import { getTelegramApiUrl } from "../lib/telegram/config"

async function updateWebhook() {
  // Ambil URL dari argumen command line
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error("Error: URL domain tidak diberikan")
    console.log("Penggunaan: npx tsx scripts/update-telegram-webhook.ts https://your-domain.com")
    process.exit(1)
  }

  const domainUrl = args[0]
  const webhookUrl = `${domainUrl}/api/telegram/webhook`

  console.log(`Memperbarui webhook ke: ${webhookUrl}`)

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
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    })

    const data = await response.json()
    console.log("Respons atur webhook:", data)

    if (data.ok) {
      console.log("✅ Webhook berhasil diperbarui!")
    } else {
      console.error("❌ Pembaruan webhook gagal:", data.description)
    }

    // Dapatkan info webhook untuk verifikasi
    const infoResponse = await fetch(getTelegramApiUrl("getWebhookInfo"))
    const infoData = await infoResponse.json()
    console.log("Info webhook:", infoData)
  } catch (error) {
    console.error("Error saat memperbarui webhook:", error)
  }
}

updateWebhook()
