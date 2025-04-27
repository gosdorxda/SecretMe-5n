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

// Function to send message to Telegram
export async function sendTelegramMessage(params: SendMessageParams): Promise<any> {
  try {
    console.log("Sending Telegram message with params:", {
      chat_id: params.chat_id,
      text_length: params.text.length,
      parse_mode: params.parse_mode,
      disable_web_page_preview: params.disable_web_page_preview,
    })

    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    console.log("Telegram API response status:", response.status)

    const responseData = await response.json()
    console.log("Telegram API response data:", responseData)

    if (!response.ok) {
      throw new Error(`Telegram API error: ${responseData.description || response.statusText}`)
    }

    return responseData
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
  console.log("Preparing new message notification for Telegram:", {
    telegramId,
    name,
    messagePreviewLength: messagePreview.length,
    profileUrl,
  })

  // Sanitize message preview to avoid Markdown formatting issues
  // and truncate to 50 characters
  let sanitizedPreview = messagePreview.replace(/[_*[\]()~`>#+=|{}.!-]/g, (match) => `\\${match}`).substring(0, 50)

  // Add ellipsis if truncated
  if (messagePreview.length > 50) {
    sanitizedPreview += "..."
  }

  const message = formatTelegramMessage(TELEGRAM_MESSAGE_TEMPLATES.NEW_MESSAGE, {
    name,
    preview: sanitizedPreview,
    url: profileUrl,
  })

  console.log("Formatted Telegram message:", message)

  return sendTelegramMessage({
    chat_id: telegramId,
    text: message,
    parse_mode: "MarkdownV2", // Using MarkdownV2 for spoiler tags
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
