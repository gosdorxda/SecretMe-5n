// Script untuk mengirim pesan test ke Telegram
// Jalankan dengan: npx tsx scripts/test-telegram-message.ts TELEGRAM_CHAT_ID

// Ambil environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN environment variable")
  console.error("Run with: TELEGRAM_BOT_TOKEN=xxx npx tsx scripts/test-telegram-message.ts TELEGRAM_CHAT_ID")
  process.exit(1)
}

// Ambil telegram chat ID dari argumen command line
const telegramChatId = process.argv[2]

if (!telegramChatId) {
  console.error("Please provide a TELEGRAM_CHAT_ID")
  console.error("Usage: npx tsx scripts/test-telegram-message.ts TELEGRAM_CHAT_ID")
  process.exit(1)
}

async function testTelegramMessage() {
  try {
    console.log("🧪 SENDING TEST MESSAGE TO TELEGRAM")
    console.log("=================================\n")

    console.log(`Sending test message to chat ID: ${telegramChatId}`)

    const testMessage = `
🧪 <b>Test Message</b>

This is a test message from the Telegram test script.
Time: ${new Date().toLocaleString()}

If you receive this message, your Telegram bot is working correctly!
    `

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: testMessage,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("✅ Test message sent successfully")
      console.log(`   Message ID: ${data.result.message_id}`)
    } else {
      console.error("❌ Error sending test message:", data.description)
    }
  } catch (error) {
    console.error("Error sending test message:", error)
  }
}

testTelegramMessage()
