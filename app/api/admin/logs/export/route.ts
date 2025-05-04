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
    const format = searchParams.get("format") || "csv"
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const gateway = searchParams.get("gateway") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    let query

    // Pilih tabel berdasarkan tipe log
    switch (type) {
      case "payment":
        query = supabase.from("payment_notification_logs").select("*")

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
        query = supabase.from("transaction_logs").select("*")

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
        query = supabase.from("sitemap_logs").select("*")
        break

      case "access":
        query = supabase.from("rate_limit_logs").select("*")

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

    // Tambahkan sorting
    query = query.order("created_at", { ascending: false })

    // Batasi jumlah data yang diambil untuk export
    query = query.limit(10000)

    const { data, error: queryError } = await query

    if (queryError) {
      console.error("Error fetching logs for export:", queryError)
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }

    if (format === "json") {
      // Return JSON data
      return NextResponse.json({
        data,
        type,
        exportedAt: new Date().toISOString(),
      })
    } else {
      // Convert to CSV
      const csv = convertToCSV(data, type)

      // Return CSV file
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${type}-logs-${new Date().toISOString().split("T")[0]}.csv`,
        },
      })
    }
  } catch (error) {
    console.error("Error in logs export API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[], type: string): string {
  if (!data || data.length === 0) {
    return ""
  }

  // Get headers based on log type
  let headers: string[] = []

  switch (type) {
    case "payment":
      headers = [
        "id",
        "request_id",
        "gateway",
        "raw_payload",
        "status",
        "error",
        "transaction_id",
        "order_id",
        "created_at",
      ]
      break
    case "transaction":
      headers = [
        "id",
        "transaction_id",
        "order_id",
        "user_id",
        "event_type",
        "gateway",
        "status",
        "previous_status",
        "payment_method",
        "amount",
        "created_at",
      ]
      break
    case "sitemap":
      headers = ["id", "triggered_at", "user_count", "last_updated", "triggered_by", "created_at"]
      break
    case "access":
      headers = ["id", "ip", "path", "method", "blocked", "rate", "limit", "user_id", "created_at"]
      break
    default:
      headers = Object.keys(data[0])
  }

  // Create CSV header row
  let csv = headers.join(",") + "\n"

  // Add data rows
  data.forEach((item) => {
    const row = headers.map((header) => {
      const value = item[header]

      // Handle special cases
      if (value === null || value === undefined) {
        return ""
      }

      if (typeof value === "object") {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }

      if (typeof value === "string") {
        return `"${value.replace(/"/g, '""')}"`
      }

      return value
    })

    csv += row.join(",") + "\n"
  })

  return csv
}
