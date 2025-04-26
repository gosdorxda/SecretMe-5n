// Konfigurasi untuk Fonnte WhatsApp API
export const FONNTE_API_URL = "https://api.fonnte.com"
export const FONNTE_DEVICE_ID = process.env.FONNTE_DEVICE_ID || ""
export const FONNTE_API_KEY = process.env.FONNTE_API_KEY || ""

// Template pesan
export const MESSAGE_TEMPLATES = {
  NEW_MESSAGE: "Halo {name}, Anda menerima pesan baru di SecretMe! Pesan: {preview}... Klik untuk melihat: {url}",
  MESSAGE_REPLY: "Halo {name}, pesan Anda telah dibalas di SecretMe! Balasan: {preview}... Klik untuk melihat: {url}",
}

// Validasi nomor telepon Indonesia
export function isValidIndonesianPhoneNumber(phone: string): boolean {
  // Hapus semua karakter non-digit
  const cleanPhone = phone.replace(/\D/g, "")

  // Cek apakah dimulai dengan 62 atau 0
  if (cleanPhone.startsWith("62")) {
    return cleanPhone.length >= 10 && cleanPhone.length <= 14
  } else if (cleanPhone.startsWith("0")) {
    return cleanPhone.length >= 9 && cleanPhone.length <= 13
  }

  return false
}

// Perbaiki fungsi formatPhoneNumber untuk memastikan format yang benar
export function formatPhoneNumber(phone: string): string {
  console.log("Formatting phone number:", phone)

  // Hapus semua karakter non-digit
  const cleanPhone = phone.replace(/\D/g, "")
  console.log("Cleaned phone number:", cleanPhone)

  // Jika dimulai dengan 0, ganti dengan 62
  if (cleanPhone.startsWith("0")) {
    const formatted = "62" + cleanPhone.substring(1)
    console.log("Formatted from 0 to 62:", formatted)
    return formatted
  }

  // Jika sudah dimulai dengan 62, kembalikan apa adanya
  if (cleanPhone.startsWith("62")) {
    console.log("Already starts with 62, keeping as is")
    return cleanPhone
  }

  // Jika dimulai dengan +62, hapus + dan kembalikan
  if (phone.startsWith("+62")) {
    const formatted = cleanPhone
    console.log("Formatted from +62:", formatted)
    return formatted
  }

  // Jika tidak dimulai dengan 0 atau 62, tambahkan 62 di depan
  const formatted = "62" + cleanPhone
  console.log("Adding 62 prefix:", formatted)
  return formatted
}
