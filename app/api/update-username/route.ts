import { NextResponse } from "next/server"
import { createClient, getVerifiedUser } from "@/lib/supabase/server"
import { isReservedUsername } from "@/lib/reserved-usernames"

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getVerifiedUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { username } = await request.json()

    // Validasi format username
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!username || !usernameRegex.test(username)) {
      return NextResponse.json({ error: "Format username tidak valid" }, { status: 400 })
    }

    // Validasi reserved username
    if (isReservedUsername(username)) {
      return NextResponse.json(
        { error: "Username ini dicadangkan untuk sistem dan tidak dapat digunakan" },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // Cek apakah username sudah digunakan
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 })
    }

    // Update username
    const { error: updateError } = await supabase
      .from("users")
      .update({ username, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json({ error: "Gagal memperbarui username" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating username:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
