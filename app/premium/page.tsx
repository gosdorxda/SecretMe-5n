import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { PremiumClient } from "./client"
import type { Database } from "@/lib/supabase/database.types"

// Buat Supabase client yang tidak bergantung pada cookies untuk prerendering
const createDirectClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Tandai halaman ini sebagai dinamis untuk menghindari prerendering statis
export const dynamic = "force-dynamic"

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  let supabase

  try {
    // Coba gunakan cookies jika tersedia
    const cookieStore = cookies()
    supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "", {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })
  } catch (error) {
    // Jika cookies tidak tersedia (saat prerendering), gunakan direct client
    console.log("Cookies tidak tersedia, menggunakan direct client")
    supabase = createDirectClient()
  }

  // Get user session
  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch (error) {
    console.error("Error getting session:", error)
  }

  // Check if user is logged in
  const isLoggedIn = !!session

  // Get user data if logged in
  let isPremium = false
  let userName = ""
  let transaction = null

  // Get URL parameters for status
  const urlStatus = searchParams.status as string | undefined
  const urlOrderId = searchParams.order_id as string | undefined

  let premiumPrice = Number.parseInt(process.env.PREMIUM_PRICE || "49000")
  let activeGateway = process.env.ACTIVE_PAYMENT_GATEWAY || "duitku"

  // Try to get from database first
  try {
    const { data: configData } = await supabase
      .from("site_config")
      .select("config")
      .eq("type", "premium_settings")
      .single()

    if (configData?.config) {
      // Use price from database if available
      if (configData.config.price) {
        premiumPrice = Number.parseInt(configData.config.price.toString())
      }

      // Use active gateway from database if available
      if (configData.config.activeGateway) {
        activeGateway = configData.config.activeGateway
      }
    }
  } catch (error) {
    console.error("Error getting premium settings:", error)
  }

  if (isLoggedIn) {
    try {
      // Get authenticated user data
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // If no authenticated user, treat as not logged in
        return (
          <PremiumClient
            isLoggedIn={false}
            isPremium={false}
            userName=""
            premiumPrice={premiumPrice}
            urlStatus={urlStatus}
            urlOrderId={urlOrderId}
            transaction={null}
            activeGateway={activeGateway}
          />
        )
      }

      // Get user data
      const { data: userData } = await supabase.from("users").select("name, is_premium").eq("id", user.id).single()

      if (userData) {
        isPremium = userData.is_premium || false
        userName = userData.name || ""
      }

      // Get latest transaction
      const { data: transactionData } = await supabase
        .from("premium_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (transactionData) {
        transaction = transactionData
      }
    } catch (error) {
      console.error("Error getting user data:", error)
    }
  }

  return (
    <PremiumClient
      isLoggedIn={isLoggedIn}
      isPremium={isPremium}
      userName={userName}
      premiumPrice={premiumPrice}
      urlStatus={urlStatus}
      urlOrderId={urlOrderId}
      transaction={transaction}
      activeGateway={activeGateway} // Pass the active gateway to the client
    />
  )
}
