import { TELEGRAM_BOT_TOKEN, TELEGRAM_MESSAGE_TEMPLATES, formatTelegramMessage } from "./config"

// Base URL for Telegram Bot API
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Interface for sending message parameters
interface SendMessageParams {
  chat_id: string
  text: string
  parse_mode?: "Markdown" | "MarkdownV2" | "HTML"
  disable_web_page_preview?: boolean
}

// Variables for rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 50 // 50ms = maksimal 20 request per detik

// Function to send message to Telegram with throttling and retry
export async function sendTelegramMessage(params: SendMessageParams): Promise<any> {
  // Implementasi throttling sederhana
  const now = Date.now()
  const timeElapsed = now - lastRequestTime

  if (timeElapsed < MIN_REQUEST_INTERVAL) {
    // Tunggu sampai interval minimum terpenuhi
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeElapsed))
  }

  // Update waktu request terakhir
  lastRequestTime = Date.now()

  // Implementasi retry dengan exponential backoff
  let retries = 0
  const MAX_RETRIES = 3

  while (retries <= MAX_RETRIES) {
    try {
      console.log(`Sending Telegram message to ${params.chat_id}. Attempt ${retries + 1}/${MAX_RETRIES + 1}`)

      const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      console.log(`Telegram API response status: ${response.status}`)

      const responseData = await response.json()

      if (!response.ok) {
        // Cek apakah error adalah rate limiting (429 Too Many Requests)
        if (response.status === 429 && retries < MAX_RETRIES) {
          // Ambil retry_after dari response jika ada
          const retryAfter = responseData.parameters?.retry_after || Math.pow(2, retries) * 1000
          console.log(`Rate limited by Telegram. Retrying after ${retryAfter}ms. Retry ${retries + 1}/${MAX_RETRIES}`)

          // Tunggu sesuai retry_after atau exponential backoff
          await new Promise((resolve) => setTimeout(resolve, retryAfter))
          retries++
          continue
        }

        throw new Error(`Telegram API error: ${responseData.description || response.statusText}`)
      }

      console.log("Telegram message sent successfully")
      return responseData
    } catch (error) {
      console.error(`Error sending Telegram message (attempt ${retries + 1}/${MAX_RETRIES + 1}):`, error)

      // Jika error bukan karena rate limiting atau sudah mencapai max retries
      if (retries >= MAX_RETRIES) {
        console.error("Max retries reached. Giving up.")
        throw error
      }

      // Exponential backoff untuk error lainnya
      const backoffTime = Math.pow(2, retries) * 1000
      console.log(`Retrying after ${backoffTime}ms. Retry ${retries + 1}/${MAX_RETRIES}`)
      await new Promise((resolve) => setTimeout(resolve, backoffTime))
      retries++
    }
  }
}

// Function to send verification code
export async function sendVerificationCode(telegramId: string, code: string): Promise<any> {
  const message = formatTelegramMessage(TELEGRAM_MESSAGE_TEMPLATES.VERIFICATION, {
    code,
  })

  return sendTelegramMessage({
    chat_id: telegramId,
    text: message,
    parse_mode: "Markdown",
  })
}

// Karena kita menghapus bagian preview pesan, kita perlu menyesuaikan fungsi sendNewMessageNotification
// untuk tidak lagi memproses preview pesan

export async function sendNewMessageNotification(params: {
  telegramId: string
  name: string
  messagePreview: string
  profileUrl: string
}): Promise<any> {
  const { telegramId, name, profileUrl } = params
  console.log("Preparing new message notification for Telegram:", {
    telegramId,
    name,
    profileUrl,
  })

  // Create the message with sanitized values
  const message = formatTelegramMessage(TELEGRAM_MESSAGE_TEMPLATES.NEW_MESSAGE, {
    name: name.replace(/\*/g, ""), // Remove any asterisks from name
    url: profileUrl,
  })

  console.log("Formatted Telegram message:", message)

  return sendTelegramMessage({
    chat_id: telegramId,
    text: message,
    parse_mode: "Markdown", // Using regular Markdown
    disable_web_page_preview: false,
  })
}

// Function to send test message
export async function sendTestMessage(telegramId: string, name: string): Promise<any> {
  // Sanitize name to avoid Markdown formatting issues
  const sanitizedName = name.replace(/\*/g, "")

  const message = formatTelegramMessage(TELEGRAM_MESSAGE_TEMPLATES.TEST, {
    name: sanitizedName,
  })

  return sendTelegramMessage({
    chat_id: telegramId,
    text: message,
    parse_mode: "Markdown",
  })
}

// Function to send connection success message
export async function sendConnectionSuccessMessage(telegramId: string): Promise<any> {
  return sendTelegramMessage({
    chat_id: telegramId,
    text: TELEGRAM_MESSAGE_TEMPLATES.CONNECTION_SUCCESS,
    parse_mode: "Markdown",
  })
}

// Function to send disconnection message
export async function sendDisconnectionMessage(telegramId: string): Promise<any> {
  return sendTelegramMessage({
    chat_id: telegramId,
    text: TELEGRAM_MESSAGE_TEMPLATES.DISCONNECTED,
    parse_mode: "Markdown",
  })
}

// Function to send help message
export async function sendHelpMessage(telegramId: string): Promise<any> {
  return sendTelegramMessage({
    chat_id: telegramId,
    text: TELEGRAM_MESSAGE_TEMPLATES.HELP,
    parse_mode: "Markdown",
  })
}
