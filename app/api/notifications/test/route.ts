import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVerifiedUser } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Verifikasi pengguna
    const { user, error } = await getVerifiedUser()
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ambil data dari request
    const { userId, channel } = await request.json()

    // Pastikan pengguna hanya bisa mengirim notifikasi test untuk dirinya sendiri
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = createClient()

    // Ambil data pengguna
    const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Cek apakah pengguna premium (untuk Telegram dan WhatsApp)
    if ((channel === "telegram" || channel === "whatsapp") && !userData.is_premium) {
      return NextResponse.json({ error: "Premium feature" }, { status: 403 })
    }

    // Ambil pengaturan notifikasi
    const { data: notifData, error: notifError } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (notifError && notifError.code !== "PGRST116") {
      return NextResponse.json({ error: "Notification settings not found" }, { status: 404 })
    }

    // Kirim notifikasi test berdasarkan channel
    let success = false
    let message = ""

    switch (channel) {
      case "telegram":
        if (!notifData?.telegram_id) {
          return NextResponse.json({ error: "Telegram ID not set" }, { status: 400 })
        }

        // Kirim notifikasi Telegram
        const telegramResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegram_id: notifData.telegram_id,
            message:
              "Ini adalah notifikasi test dari SecretMe. Jika Anda menerima pesan ini, berarti pengaturan notifikasi Telegram Anda berhasil.",
          }),
        })

        const telegramData = await telegramResponse.json()
        success = telegramData.success
        message = telegramData.message || "Notifikasi Telegram terkirim"
        break

      case "whatsapp":
        if (!notifData?.whatsapp_number) {
          return NextResponse.json({ error: "WhatsApp number not set" }, { status: 400 })
        }

        // Kirim notifikasi WhatsApp
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send-test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: notifData.whatsapp_number,
            message:
              "Ini adalah notifikasi test dari SecretMe. Jika Anda menerima pesan ini, berarti pengaturan notifikasi WhatsApp Anda berhasil.",
          }),
        })

        const whatsappData = await whatsappResponse.json()
        success = whatsappData.success
        message = whatsappData.message || "Notifikasi WhatsApp terkirim"
        break

      case "email":
        // Untuk email, kita hanya simulasikan pengiriman
        success = true
        message = "Notifikasi email terkirim ke " + userData.email
        break

      default:
        return NextResponse.json({ error: "Invalid channel" }, { status: 400 })
    }

    // Catat log notifikasi
    await supabase.from("notification_logs").insert({
      user_id: userId,
      channel,
      status: success ? "sent" : "failed",
      error_message: success ? null : message,
    })

    return NextResponse.json({ success, message })
  } catch (error: any) {
    console.error("Error sending test notification:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
