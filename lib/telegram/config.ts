// Telegram configuration

// Telegram bot token from environment variables
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

// Message templates for different notification types
export const TELEGRAM_MESSAGE_TEMPLATES = {
  NEW_MESSAGE:
    "🔔 *Pesan Baru*\n\nHalo {name}, Anda menerima pesan baru di SecretMe!\n\n📝 Pesan: {preview}...\n\n🔗 [Lihat Pesan]({url})",
  VERIFICATION:
    "🔐 *Kode Verifikasi*\n\nHalo! Kode verifikasi Anda untuk SecretMe adalah: *{code}*\n\nKode ini berlaku selama 10 menit.",
  TEST: "✅ *Pesan Test*\n\nHalo {name}! Ini adalah pesan test dari SecretMe. Jika Anda menerima pesan ini, berarti notifikasi Telegram Anda sudah berfungsi dengan baik.",
}

// Function to validate Telegram ID
export function isValidTelegramId(telegramId: string): boolean {
  // Telegram chat IDs are numeric
  return /^\d+$/.test(telegramId)
}

// Function to format message with placeholders
export function formatTelegramMessage(template: string, data: Record<string, string>): string {
  let message = template

  for (const [key, value] of Object.entries(data)) {
    message = message.replace(new RegExp(`{${key}}`, "g"), value)
  }

  return message
}
