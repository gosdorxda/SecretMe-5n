import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verifikasi user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Periksa apakah user adalah admin
    const { data: userData, error: userError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 })
    }

    // Ambil riwayat transaksi
    const { data: transactions, error: transactionsError } = await supabase
      .from("premium_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    return NextResponse.json({ success: true, transactions })
  } catch (error: any) {
    console.error("Error in transactions API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
