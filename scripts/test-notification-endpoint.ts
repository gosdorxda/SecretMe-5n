// Script untuk menguji endpoint notifikasi
// Jalankan dengan: npx tsx scripts/test-notification-endpoint.ts USER_ID

// Ambil environment variables
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Ambil user ID dari argumen command line
const userId = process.argv[2]
if (!userId) {
  console.error("Please provide a user ID")
  console.error("Usage: npx tsx scripts/test-notification-endpoint.ts USER_ID")
  process.exit(1)
}

async function testNotificationEndpoint() {
  try {
    console.log("🧪 TESTING NOTIFICATION ENDPOINT")
    console.log("==============================\n")

    console.log(`Testing notification endpoint for user ID: ${userId}`)

    // Buat pesan dummy untuk testing
    const dummyMessage = {
      id: `test-${Date.now()}`,
      content: `Test message sent at ${new Date().toLocaleString()}`,
    }

    // Kirim request ke endpoint notifikasi
    const response = await fetch(`${APP_URL}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        messageId: dummyMessage.id,
        type: "new_message",
      }),
    })

    const data = await response.json()

    console.log("Response from notification endpoint:", data)

    if (response.ok) {
      console.log("✅ Notification endpoint responded successfully")

      if (data.success) {
        console.log("✅ Notification was triggered successfully")

        if (data.result && data.result.success) {
          console.log("✅ Telegram notification was sent successfully")
        } else if (data.result) {
          console.error("❌ Telegram notification failed:", data.result.error)
        }
      } else {
        console.error("❌ Notification trigger failed:", data.error)
      }
    } else {
      console.error("❌ Notification endpoint error:", response.status, response.statusText)
    }

    console.log("\n✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error testing notification endpoint:", error)
  }
}

testNotificationEndpoint()
