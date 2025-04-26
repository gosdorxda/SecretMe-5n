import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Validate environment variables
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN

if (!telegramBotToken) {
  console.error("❌ Missing environment variable. Please set TELEGRAM_BOT_TOKEN")
  process.exit(1)
}

// Get chat ID from command line arguments
const chatId = process.argv[2]

if (!chatId) {
  console.error("❌ Please provide a chat ID as an argument")
  console.log("Usage: npx tsx scripts/test-direct-telegram.ts CHAT_ID")
  process.exit(1)
}

async function testDirectTelegram() {
  console.log("🧪 TESTING DIRECT TELEGRAM MESSAGE")
  console.log("================================\n")

  // 1. Check bot info
  console.log("1️⃣ CHECKING BOT INFO")
  console.log("-------------------")

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getMe`)
    const data = await response.json()

    if (data.ok) {
      console.log("✅ Telegram Bot API is working")
      console.log(`   Bot Name: ${data.result.first_name}`)
      console.log(`   Bot Username: @${data.result.username}`)
    } else {
      console.log("❌ Telegram Bot API error:", data.description)
      process.exit(1)
    }
  } catch (error: any) {
    console.log("❌ Error checking Telegram Bot API:", error.message)
    process.exit(1)
  }
  console.log("")

  // 2. Send test message
  console.log("2️⃣ SENDING TEST MESSAGE")
  console.log("---------------------")

  const testMessage = `
🧪 Test Direct Telegram Message

This is a direct test message from the SecretMe notification system.

Time: ${new Date().toLocaleString()}
Chat ID: ${chatId}

If you're receiving this message, your Telegram bot is working correctly!
  `

  try {
    console.log(`Sending message to chat ID: ${chatId}`)

    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
      }),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("✅ Test message sent successfully")
      console.log(`   Message ID: ${data.result.message_id}`)
    } else {
      console.log("❌ Error sending test message:", data.description)
      process.exit(1)
    }
  } catch (error: any) {
    console.log("❌ Error sending test message:", error.message)
    process.exit(1)
  }
  console.log("")

  console.log("✨ TEST COMPLETE")
}

// Run the function
testDirectTelegram().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
