export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7705667287:AAEJ81NqryUtw4wOdHPTtBt8DAU27PqmAO8"
export const TELEGRAM_API_URL = "https://api.telegram.org/bot"

export function getTelegramApiUrl(method: string): string {
  return `${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/${method}`
}

export function formatPhoneNumber(phone: string): string {
  // Hapus semua karakter non-digit
  let cleaned = phone.replace(/\D/g, "")

  // Pastikan nomor dimulai dengan kode negara
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1)
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned
  }

  return cleaned
}
