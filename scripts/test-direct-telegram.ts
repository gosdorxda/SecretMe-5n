// Script untuk menguji pengiriman pesan Telegram secara langsung
// Jalankan dengan: TELEGRAM_BOT_TOKEN=your-token npx tsx scripts/test-direct-telegram.ts chat_id

// Ambil chat ID dari argumen command line
const chatId = process.argv[2]

if (!chatId) {
  console.error("Please provide a chat ID")
  console.error("Usage: TELEGRAM_BOT_TOKEN=your-token npx tsx scripts/test-direct-telegram.ts chat_id")
  process.exit(1)
}

// Ambil token bot dari environment variables
const botToken = process.env.TELEGRAM_BOT_TOKEN

if (!botToken) {
  console.error("TELEGRAM_BOT_TOKEN is not defined")
  console.error("Run with: TELEGRAM_BOT_TOKEN=your-token npx tsx scripts/test-direct-telegram.ts chat_id")
  process.exit(1)
}

async function sendTelegramMessage() {
  try {
    console.log("🔍 TESTING TELEGRAM MESSAGE")
    console.log("==========================\n")

    console.log(`Sending test message to chat ID: ${chatId}`)

    // Buat pesan test
    const message = `🔔 *Test Notification*\n\nThis is a test message sent at ${new Date().toLocaleString()}\n\nIf you received this message, your Telegram notifications are working correctly!`

    // Kirim pesan ke Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    })

    const result = await response.json()

    if (result.ok) {
      console.log("✅ Message sent successfully!")
      console.log(`Message ID: ${result.result.message_id}`)
    } else {
      console.error("❌ Failed to send message")
      console.error(`Error: ${result.description}`)
    }

    console.log("\n✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error sending Telegram message:", error)
  }
}

sendTelegramMessage()
