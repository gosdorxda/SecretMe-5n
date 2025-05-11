import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// GET: Mendapatkan pengaturan notifikasi pengguna
export async function GET() {
  try {
    const supabase = createClient(cookies())

    // Verifikasi user dengan getUser() yang lebih aman
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    // Dapatkan pengaturan notifikasi
    const { data, error } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = tidak ditemukan
      throw new Error(error.message)
    }

    // Jika tidak ada pengaturan, buat default
    if (!data) {
      const defaultSettings = {
        user_id: user.id,
        enabled: false,
        channel_type: "none",
        telegram_id: null,
        notify_new_messages: true,
        notify_replies: true,
        notify_system_updates: false,
      }

      const { data: newData, error: insertError } = await supabase
        .from("user_notification_settings")
        .insert(defaultSettings)
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      return NextResponse.json({ success: true, data: newData })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Error fetching notification settings:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notification settings" },
      { status: 500 },
    )
  }
}

// POST: Memperbarui pengaturan notifikasi
export async function POST(request: Request) {
  try {
    const formData = await request.json()
    const supabase = createClient(cookies())

    // Verifikasi user dengan getUser() yang lebih aman
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 })
    }

    // Periksa apakah pengaturan sudah ada untuk user ini
    const { data: existingSettings } = await supabase
      .from("user_notification_settings")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let result

    if (existingSettings) {
      // Update pengaturan yang sudah ada
      const { data, error } = await supabase
        .from("user_notification_settings")
        .update({
          enabled: formData.enabled,
          channel_type: formData.channel_type,
          notify_new_messages: formData.notify_new_messages,
          notify_replies: formData.notify_replies,
          notify_system_updates: formData.notify_system_updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      result = data
    } else {
      // Insert pengaturan baru
      const { data, error } = await supabase
        .from("user_notification_settings")
        .insert({
          user_id: user.id,
          enabled: formData.enabled,
          channel_type: formData.channel_type,
          notify_new_messages: formData.notify_new_messages,
          notify_replies: formData.notify_replies,
          notify_system_updates: formData.notify_system_updates,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      result = data
    }

    // Jika channel_type adalah telegram, perbarui juga telegram_notifications di tabel users
    // untuk kompatibilitas dengan kode lama selama masa transisi
    if (formData.channel_type === "telegram") {
      await supabase
        .from("users")
        .update({
          telegram_notifications: formData.enabled,
        })
        .eq("id", user.id)
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Error updating notification settings:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification settings" },
      { status: 500 },
    )
  }
}
