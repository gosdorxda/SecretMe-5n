import { getTelegramApiUrl } from "./config"

interface SendMessageParams {
  chatId: string
  message: string
  parseMode?: "HTML" | "Markdown"
}

export async function sendTelegramMessage({ chatId, message, parseMode = "HTML" }: SendMessageParams) {
  try {
    console.log(`Sending Telegram message to chat ID: ${chatId}`)
    console.log(`Message content: ${message.substring(0, 100)}...`)

    const response = await fetch(getTelegramApiUrl("sendMessage"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Telegram API error response:", data)
      throw new Error(`Telegram API error: ${data.description || "Unknown error"}`)
    }

    console.log("Telegram message sent successfully:", data)

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error("Error sending Telegram message:", error)
    return {
      success: false,
      error: error.message || "Failed to send Telegram message",
    }
  }
}

export async function sendNewMessageNotificationTelegram({
  chatId,
  name,
  messagePreview,
  profileUrl,
}: {
  chatId: string
  name: string
  messagePreview: string
  profileUrl: string
}) {
  // Batasi preview pesan ke 50 karakter
  const truncatedPreview = messagePreview.length > 50 ? messagePreview.substring(0, 50) + "..." : messagePreview

  const message = `
<b>🔔 Pesan Baru di SecretMe!</b>

Hai <b>${name}</b>, Anda menerima pesan baru:

"<i>${truncatedPreview}</i>"

<a href="${profileUrl}">Klik di sini</a> untuk melihat dan membalas pesan.

<i>Bot ini adalah layanan resmi dari SecretMe</i>
  `

  return sendTelegramMessage({
    chatId,
    message,
    parseMode: "HTML",
  })
}
