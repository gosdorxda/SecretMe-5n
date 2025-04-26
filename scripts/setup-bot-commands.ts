// This script sets up commands for your Telegram bot
// Run with: npx tsx scripts/setup-bot-commands.ts

import { getTelegramApiUrl } from "../lib/telegram/config"

async function setupBotCommands() {
  try {
    const commands = [
      {
        command: "start",
        description: "Mulai bot dan lihat pesan selamat datang",
      },
      {
        command: "help",
        description: "Tampilkan bantuan dan instruksi",
      },
      {
        command: "status",
        description: "Periksa status koneksi Anda",
      },
      {
        command: "disconnect",
        description: "Putuskan koneksi akun Anda dari SecretMe",
      },
    ]

    const response = await fetch(getTelegramApiUrl("setMyCommands"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commands,
      }),
    })

    const data = await response.json()

    if (data.ok) {
      console.log("✅ Bot commands set up successfully!")
    } else {
      console.error("❌ Failed to set up bot commands:", data.description)
    }
  } catch (error) {
    console.error("Error setting up bot commands:", error)
  }
}

setupBotCommands()
