import { FONNTE_API_URL, FONNTE_API_KEY, MESSAGE_TEMPLATES, formatPhoneNumber } from "./config"

interface SendWhatsAppParams {
  phone: string
  message: string
  delay?: number
}

interface SendTemplateParams {
  phone: string
  templateName: keyof typeof MESSAGE_TEMPLATES
  data: Record<string, string>
}

// Perbaiki fungsi sendWhatsApp untuk logging lebih detail
export async function sendWhatsApp({ phone, message, delay = 0 }: SendWhatsAppParams) {
  console.log("Sending WhatsApp message to:", phone)
  console.log("Message content:", message)

  try {
    const formattedPhone = formatPhoneNumber(phone)
    console.log("Formatted phone number:", formattedPhone)
    console.log("Using API URL:", FONNTE_API_URL)
    console.log("API Key available:", !!FONNTE_API_KEY)

    const response = await fetch(`${FONNTE_API_URL}/send`, {
      method: "POST",
      headers: {
        Authorization: FONNTE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: formattedPhone,
        message,
        delay,
      }),
    })

    console.log("Response status:", response.status)
    const data = await response.json()
    console.log("Response data:", data)

    if (!response.ok) {
      console.error("Fonnte API error:", data)
      throw new Error(`Fonnte API error: ${data.message || "Unknown error"}`)
    }

    return {
      success: true,
      data,
    }
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error)
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp message",
    }
  }
}

export async function sendTemplateMessage({ phone, templateName, data }: SendTemplateParams) {
  if (!MESSAGE_TEMPLATES[templateName]) {
    throw new Error(`Template ${templateName} not found`)
  }

  let message = MESSAGE_TEMPLATES[templateName]

  // Replace placeholders with actual data
  Object.entries(data).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, "g"), value)
  })

  return sendWhatsApp({ phone, message })
}

// Fungsi untuk mengirim notifikasi pesan baru
export async function sendNewMessageNotification(params: {
  phone: string
  name: string
  messagePreview: string
  profileUrl: string
}) {
  const { phone, name, messagePreview, profileUrl } = params

  return sendTemplateMessage({
    phone,
    templateName: "NEW_MESSAGE",
    data: {
      name,
      preview: messagePreview.length > 50 ? messagePreview.substring(0, 50) : messagePreview,
      url: profileUrl,
    },
  })
}

// Fungsi untuk mengirim notifikasi balasan pesan
export async function sendMessageReplyNotification(params: {
  phone: string
  name: string
  replyPreview: string
  messageUrl: string
}) {
  const { phone, name, replyPreview, messageUrl } = params

  return sendTemplateMessage({
    phone,
    templateName: "MESSAGE_REPLY",
    data: {
      name,
      preview: replyPreview.length > 50 ? replyPreview.substring(0, 50) : replyPreview,
      url: messageUrl,
    },
  })
}
