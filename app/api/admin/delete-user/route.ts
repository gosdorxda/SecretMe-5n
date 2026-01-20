import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )

  // Cek session dan verifikasi user dengan cara yang lebih aman
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verifikasi user dengan getUser() yang lebih aman
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error verifying user:", userError)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }

  // Verifikasi apakah user adalah admin
  const { data: adminData } = await supabase.from("users").select("email").eq("id", user.id).single()

  const adminEmails = ["gosdorxda@gmail.com"] // Ganti dengan email admin Anda

  if (!adminEmails.includes(adminData?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Proses request
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  // Eliminar datos relacionados primero
  // 1. Eliminar mensajes
  await supabase.from("messages").delete().eq("user_id", userId)

  // 2. Eliminar transacciones premium
  await supabase.from("premium_transactions").delete().eq("user_id", userId)

  // 3. Eliminar notificaciones
  try {
    await supabase.from("notification_logs").delete().eq("user_id", userId)
  } catch (error) {
    console.error("Error deleting notifications:", error)
    // Continuar incluso si hay error en esta tabla
  }

  // 4. Eliminar vistas de perfil
  try {
    await supabase.from("profile_views").delete().eq("user_id", userId)
  } catch (error) {
    console.error("Error deleting profile views:", error)
    // Continuar incluso si hay error en esta tabla
  }

  // 5. Finalmente, eliminar el usuario
  const { error: deleteUserError } = await supabase.from("users").delete().eq("id", userId)

  if (deleteUserError) {
    return NextResponse.json({ error: deleteUserError.message }, { status: 500 })
  }

  // Nota: No podemos eliminar el usuario de Auth desde el cliente
  // En una implementación completa, necesitarías una función serverless o un webhook

  return NextResponse.json({ success: true })
}
