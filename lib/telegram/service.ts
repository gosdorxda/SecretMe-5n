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

  // Truncate message preview to 50 characters
  const truncatedPreview = messagePreview.length > 50 ? messagePreview.substring(0, 50) + "..." : messagePreview

  // Sanitize the preview to avoid Markdown formatting issues
  // Replace any asterisks with spaces to prevent Markdown formatting issues
  const sanitizedPreview = truncatedPreview.replace(/\*/g, " ")

  // Apply simple censoring (replace every other character with a dot)
  const censoredPreview = sanitizedPreview.replace(/(.{1})(.{1})/g, "$1.")

  // Create the message with sanitized values
  const message = formatTelegramMessage(TELEGRAM_MESSAGE_TEMPLATES.NEW_MESSAGE, {
    name: name.replace(/\*/g, ""), // Remove any asterisks from name
    preview: censoredPreview,
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
