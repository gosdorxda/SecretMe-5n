import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Validate environment variables
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN

if (!telegramBotToken) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN environment variable")
  process.exit(1)
}

// Get chat ID from command line arguments
const chatId = process.argv[2]

if (!chatId) {
  console.error("❌ Missing chat ID argument")
  console.error("Usage: npx tsx scripts/test-direct-telegram.ts CHAT_ID")
  process.exit(1)
}

async function testDirectTelegram() {
  console.log("🔍 TESTING DIRECT TELEGRAM MESSAGE")
  console.log("=================================\n")

  try {
    // Check bot info
    console.log("1️⃣ CHECKING BOT INFO")
    console.log("-------------------")

    const botInfoResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getMe`)
    const botInfo = await botInfoResponse.json()

    if (!botInfo.ok) {
      console.error("❌ Error getting bot info:", botInfo.description)
      process.exit(1)
    }

    console.log(`✅ Bot Name: ${botInfo.result.first_name}`)
    console.log(`✅ Bot Username: @${botInfo.result.username}`)
    console.log("")

    // Send test message
    console.log("2️⃣ SENDING TEST MESSAGE")
    console.log("----------------------")
    console.log(`Sending to chat ID: ${chatId}`)

    const testMessage = `
🧪 TEST MESSAGE FROM SECRETME

This is a test message sent directly from the test-direct-telegram.ts script.
Time: ${new Date().toLocaleString()}

If you're seeing this message, direct Telegram messaging is working correctly!
    `

    const sendMessageResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
      }),
    })

    const sendMessageResult = await sendMessageResponse.json()

    if (!sendMessageResult.ok) {
      console.error("❌ Error sending message:", sendMessageResult.description)
      process.exit(1)
    }

    console.log("✅ Test message sent successfully!")
    console.log(`Message ID: ${sendMessageResult.result.message_id}`)
    console.log("")

    console.log("✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

// Run the function
testDirectTelegram()
