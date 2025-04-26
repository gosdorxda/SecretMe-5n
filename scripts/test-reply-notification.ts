// Script untuk menguji notifikasi balasan pesan
// Jalankan dengan: npx tsx scripts/test-reply-notification.ts USER_ID MESSAGE_ID

// Ambil environment variables
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Ambil user ID dan message ID dari argumen command line
const userId = process.argv[2]
const messageId = process.argv[3]

if (!userId || !messageId) {
  console.error("Please provide a user ID and message ID")
  console.error("Usage: npx tsx scripts/test-reply-notification.ts USER_ID MESSAGE_ID")
  process.exit(1)
}

async function testReplyNotification() {
  try {
    console.log("🧪 TESTING REPLY NOTIFICATION")
    console.log("===========================\n")

    console.log(`Testing reply notification for user ID: ${userId} and message ID: ${messageId}`)

    // Kirim request ke endpoint notifikasi
    const response = await fetch(`${APP_URL}/api/notifications/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        messageId,
        type: "message_reply",
      }),
    })

    const data = await response.json()

    console.log("Response from notification endpoint:", data)

    if (response.ok) {
      console.log("✅ Notification endpoint responded successfully")

      if (data.success) {
        console.log("✅ Reply notification was triggered successfully")

        if (data.result && data.result.success) {
          console.log("✅ Telegram reply notification was sent successfully")
        } else if (data.result) {
          console.error("❌ Telegram reply notification failed:", data.result.error)
        }
      } else {
        console.error("❌ Reply notification trigger failed:", data.error)
      }
    } else {
      console.error("❌ Notification endpoint error:", response.status, response.statusText)
    }

    console.log("\n✨ TEST COMPLETE")
  } catch (error) {
    console.error("Error testing reply notification:", error)
  }
}

testReplyNotification()
