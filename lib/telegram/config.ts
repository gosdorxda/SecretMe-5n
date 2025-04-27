// Telegram configuration

// Telegram bot token from environment variables
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

// Message templates for different notification types
export const TELEGRAM_MESSAGE_TEMPLATES = {
  NEW_MESSAGE:
    "🔔 *Ada Pesan Baru!*\n\n" +
    "Hai {name},\n" +
    "Anda baru saja menerima pesan di SecretMe.\n\n" +
    "👤 *Dari:* Seseorang\n" +
    "💬 *Pesan:* ||{preview}||\n\n" +
    "🔗 [Buka SecretMe untuk membaca selengkapnya]({url})",
  VERIFICATION:
    "🔐 *Kode Verifikasi*\n\n" +
    "Halo! Kode verifikasi Anda untuk SecretMe adalah: *{code}*\n\n" +
    "Kode ini berlaku selama 10 menit.",
  TEST:
    "✅ *Notifikasi Berhasil Terhubung!*\n\n" +
    "Halo {name}!\n\n" +
    "Selamat! Notifikasi Telegram Anda telah berhasil dikonfigurasi. Anda akan menerima pemberitahuan saat ada pesan baru di SecretMe.\n\n" +
    "Gunakan perintah berikut:\n" +
    "• /help - Melihat bantuan\n" +
    "• /status - Memeriksa status koneksi\n" +
    "• /disconnect - Memutuskan koneksi akun",
  CONNECTION_SUCCESS:
    "✅ *Koneksi Berhasil!*\n\n" +
    "Akun SecretMe Anda telah berhasil terhubung dengan Telegram.\n\n" +
    "Anda akan menerima notifikasi saat ada pesan baru. Gunakan perintah /help untuk melihat bantuan.",
  DISCONNECTED:
    "🔌 *Akun Terputus*\n\n" +
    "Akun SecretMe Anda telah berhasil diputuskan dari Telegram.\n\n" +
    "Anda tidak akan lagi menerima notifikasi pesan. Jika ingin menghubungkan kembali, silakan kunjungi pengaturan notifikasi di SecretMe.",
  HELP:
    "📚 *Bantuan SecretMe Bot*\n\n" +
    "Bot ini mengirimkan notifikasi saat Anda menerima pesan baru di SecretMe.\n\n" +
    "Perintah yang tersedia:\n" +
    "• /start - Memulai bot\n" +
    "• /help - Menampilkan bantuan ini\n" +
    "• /status - Memeriksa status koneksi\n" +
    "• /disconnect - Memutuskan koneksi akun",
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
