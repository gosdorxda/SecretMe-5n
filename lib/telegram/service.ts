import { TELEGRAM_BOT_TOKEN, TELEGRAM_MESSAGE_TEMPLATES, formatTelegramMessage } from "./config"

// Base URL for Telegram Bot API
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Interface for sending message parameters
interface SendMessageParams {
  chat_id: string
  text: string
  parse_mode?: "Markdown" | "HTML"
  disable_web_page_preview?: boolean
}

// Function to send message to Telegram
export async function sendTelegramMessage(params: SendMessageParams): Promise<any> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending Telegram message:", error)
    throw error
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

// Function to send new message notification
export async function sendNewMessageNotification(params: {
  telegramId: string
  name: string
  messagePreview: string
  profileUrl: string
}): Promise<any> {
  const { telegramId, name, messagePreview, profileUrl } = params

  // Truncate message preview to 50 characters
  const truncatedPreview = messagePreview.length > 50 ? messagePreview.substring(0, 50) : messagePreview

  const message = formatTelegramMessage(TELEGRAM_MESSAGE_TEMPLATES.NEW_MESSAGE, {
    name,
    preview: truncatedPreview,
    url: profileUrl,
  })

  return sendTelegramMessage({
    chat_id: telegramId,
    text: message,
    parse_mode: "Markdown",
    disable_web_page_preview: false,
  })
}

// Function to send test message
export async function sendTestMessage(telegramId: string, name: string): Promise<any> {
  const message = formatTelegramMessage(TELEGRAM_MESSAGE_TEMPLATES.TEST, {
    name,
  })

  return sendTelegramMessage({
    chat_id: telegramId,
    text: message,
    parse_mode: "Markdown",
  })
}
