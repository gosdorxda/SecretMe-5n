// Script ini memeriksa status webhook Telegram Anda
// Jalankan dengan: npx tsx scripts/check-telegram-webhook.ts

import { getTelegramApiUrl } from "../lib/telegram/config"

async function checkWebhook() {
  console.log("Memeriksa status webhook Telegram...")

  try {
    // Dapatkan informasi webhook
    const response = await fetch(getTelegramApiUrl("getWebhookInfo"))
    const data = await response.json()

    console.log("Informasi Webhook:")
    console.log(JSON.stringify(data, null, 2))

    if (data.ok && data.result.url) {
      console.log("\n✅ Webhook aktif dan terdaftar di URL:")
      console.log(data.result.url)

      if (data.result.pending_update_count > 0) {
        console.log(`\n⚠️ Ada ${data.result.pending_update_count} update yang tertunda!`)
      } else {
        console.log("\n✅ Tidak ada update yang tertunda")
      }

      console.log("\nInformasi tambahan:")
      console.log(`- Sertifikat kustom: ${data.result.has_custom_certificate ? "Ya" : "Tidak"}`)
      console.log(`- Koneksi maksimum: ${data.result.max_connections}`)
      console.log(`- Alamat IP: ${data.result.ip_address}`)

      if (data.result.last_error_date) {
        const errorDate = new Date(data.result.last_error_date * 1000)
        console.log(`\n❌ Error terakhir pada: ${errorDate.toLocaleString()}`)
        console.log(`Error: ${data.result.last_error_message}`)
      }
    } else if (data.ok && !data.result.url) {
      console.log("\n❌ Tidak ada webhook yang terdaftar!")
      console.log("Jalankan script setup-telegram-webhook.ts untuk mendaftarkan webhook")
    } else {
      console.log("\n❌ Gagal mendapatkan informasi webhook:")
      console.log(data.description || "Error tidak diketahui")
    }
  } catch (error) {
    console.error("Error saat memeriksa webhook:", error)
  }
}

checkWebhook()
