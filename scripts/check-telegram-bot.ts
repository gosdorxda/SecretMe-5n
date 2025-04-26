// Script untuk memeriksa status bot Telegram
// Jalankan dengan: npx tsx scripts/check-telegram-bot.ts

// Ambil environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN environment variable")
  console.error("Run with: TELEGRAM_BOT_TOKEN=xxx npx tsx scripts/check-telegram-bot.ts")
  process.exit(1)
}

async function checkTelegramBot() {
  try {
    console.log("🤖 CHECKING TELEGRAM BOT STATUS")
    console.log("=============================\n")

    // 1. Check bot info
    console.log("1️⃣ CHECKING BOT INFO")
    console.log("-------------------")

    const infoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    const infoData = await infoResponse.json()

    if (infoData.ok) {
      console.log("✅ Bot info retrieved successfully")
      console.log(`   Bot ID: ${infoData.result.id}`)
      console.log(`   Bot Name: ${infoData.result.first_name}`)
      console.log(`   Bot Username: @${infoData.result.username}`)
      console.log(`   Is Bot: ${infoData.result.is_bot}`)
    } else {
      console.error("❌ Error retrieving bot info:", infoData.description)
      return
    }

    // 2. Check webhook info
    console.log("\n2️⃣ CHECKING WEBHOOK INFO")
    console.log("----------------------")

    const webhookResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const webhookData = await webhookResponse.json()

    if (webhookData.ok) {
      console.log("✅ Webhook info retrieved successfully")

      if (webhookData.result.url) {
        console.log(`   Webhook URL: ${webhookData.result.url}`)
        console.log(`   Has Custom Certificate: ${webhookData.result.has_custom_certificate}`)
        console.log(`   Pending Update Count: ${webhookData.result.pending_update_count}`)

        if (webhookData.result.last_error_date) {
          const errorDate = new Date(webhookData.result.last_error_date * 1000)
          console.log(`   Last Error Date: ${errorDate.toLocaleString()}`)
          console.log(`   Last Error Message: ${webhookData.result.last_error_message}`)
        }

        if (webhookData.result.max_connections) {
          console.log(`   Max Connections: ${webhookData.result.max_connections}`)
        }

        if (webhookData.result.allowed_updates) {
          console.log(`   Allowed Updates: ${webhookData.result.allowed_updates.join(", ")}`)
        }
      } else {
        console.log("   No webhook set")
      }
    } else {
      console.error("❌ Error retrieving webhook info:", webhookData.description)
    }

    // 3. Check bot commands
    console.log("\n3️⃣ CHECKING BOT COMMANDS")
    console.log("----------------------")

    const commandsResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMyCommands`)
    const commandsData = await commandsResponse.json()

    if (commandsData.ok) {
      console.log("✅ Bot commands retrieved successfully")

      if (commandsData.result.length > 0) {
        console.log("   Commands:")
        commandsData.result.forEach((command: any) => {
          console.log(`   - /${command.command}: ${command.description}`)
        })
      } else {
        console.log("   No commands set")
      }
    } else {
      console.error("❌ Error retrieving bot commands:", commandsData.description)
    }

    console.log("\n✨ CHECK COMPLETE")
  } catch (error) {
    console.error("Error checking Telegram bot:", error)
  }
}

checkTelegramBot()
