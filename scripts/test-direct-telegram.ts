// Script untuk menguji pengiriman pesan Telegram secara langsung
// Jalankan dengan: npx tsx scripts/test-direct-telegram.ts CHAT_ID

// Ambil environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Ambil chat ID dari argumen command line
const chatId = process.argv[2]
if (!chatId) {
  console.error("Please provide a chat ID")
  console.error("Usage: npx tsx scripts/test-direct-telegram.ts CHAT_ID")
  process.exit(1)
}

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not defined")
  console.error("Set the TELEGRAM_BOT_TOKEN environment variable")
  process.exit(1)
}

async function testDirectTelegram() {
  try {
    console.log("🧪 TESTING DIRECT TELEGRAM MESSAGE")
    console.log("=================================\n")

    console.log(`Sending test message to chat ID: ${chatId}`)

    // Buat pesan test
    const testMessage = `
<b>🧪 Test Message from SecretMe</b>

This is a test message sent at ${new Date().toLocaleString()}.

If you're seeing this message, direct Telegram messaging is working correctly!

<i>Bot ini adalah layanan resmi dari SecretMe</i>
    `

    // Kirim pesan ke Telegram
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: "HTML",
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error("❌ Error sending message to Telegram:", data)
      console.error("Error description:", data.description)
      return
    }

    console.log("✅ Message sent successfully!")
    console.log("Response:", data)

    console.log("\n✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error testing direct Telegram message:", error)
  }
}

testDirectTelegram()
