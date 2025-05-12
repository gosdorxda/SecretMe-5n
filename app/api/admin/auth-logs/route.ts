import { NextResponse } from "next/server"
import { getVerifiedUser, isAdmin } from "@/lib/supabase/server"
import { getRecentAuthLogs, getAuthStats, clearAuthLogs } from "@/lib/auth-logger"

export async function GET(request: Request) {
  try {
    // Verifikasi user
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Periksa apakah user adalah admin
    const userIsAdmin = await isAdmin(user.id)

    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Ambil parameter dari URL
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")
    const stats = url.searchParams.get("stats") === "true"

    // Ambil data
    const logs = getRecentAuthLogs(limit)
    const response: any = { logs }

    if (stats) {
      response.stats = getAuthStats()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching auth logs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Verifikasi user
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Periksa apakah user adalah admin
    const userIsAdmin = await isAdmin(user.id)

    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Bersihkan log
    clearAuthLogs()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing auth logs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
