import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVerifiedUser, isAdmin } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Verifikasi user admin
    const { user, error } = await getVerifiedUser()

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminStatus = await isAdmin(user.id)

    if (!adminStatus) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams

    // Parameter untuk query
    const type = searchParams.get("type") || "payment"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const gateway = searchParams.get("gateway") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    let query

    // Pilih tabel berdasarkan tipe log
    switch (type) {
      case "payment":
        query = supabase.from("payment_notification_logs").select("*", { count: "exact" })

        if (search) {
          query = query.or(`order_id.ilike.%${search}%,request_id.ilike.%${search}%`)
        }

        if (gateway) {
          query = query.eq("gateway", gateway)
        }

        if (status) {
          query = query.eq("status", status)
        }
        break

      case "transaction":
        query = supabase.from("transaction_logs").select("*", { count: "exact" })

        if (search) {
          query = query.or(`order_id.ilike.%${search}%,transaction_id.eq.${search}`)
        }

        if (gateway) {
          query = query.eq("gateway", gateway)
        }

        if (status) {
          query = query.eq("status", status)
        }
        break

      case "sitemap":
        query = supabase.from("sitemap_logs").select("*", { count: "exact" })
        break

      case "access":
        query = supabase.from("rate_limit_logs").select("*", { count: "exact" })

        if (search) {
          query = query.or(`ip.ilike.%${search}%,path.ilike.%${search}%`)
        }

        if (status === "blocked") {
          query = query.eq("blocked", true)
        } else if (status === "allowed") {
          query = query.eq("blocked", false)
        }
        break

      default:
        return NextResponse.json({ error: "Invalid log type" }, { status: 400 })
    }

    // Tambahkan filter tanggal jika ada
    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Tambahkan pagination
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, count, error: queryError } = await query

    if (queryError) {
      console.error("Error fetching logs:", queryError)
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }

    return NextResponse.json({
      data,
      count,
      pagination: {
        offset,
        limit,
        total: count,
      },
    })
  } catch (error) {
    console.error("Error in logs API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
