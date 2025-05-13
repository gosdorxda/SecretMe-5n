import { createClient } from "@/lib/supabase/server"
import { PremiumClient } from "./client"

// Cache untuk pengaturan premium
let premiumSettingsCache = null
let premiumSettingsCacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 menit

// Pastikan halaman ini selalu dirender secara dinamis
export const dynamic = "force-dynamic"

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()

  // Get URL parameters for status
  const urlStatus = searchParams.status as string | undefined
  const urlOrderId = searchParams.order_id as string | undefined

  // Gunakan cache jika masih valid
  const now = Date.now()
  let premiumPrice = Number.parseInt(process.env.PREMIUM_PRICE || "49000")
  let activeGateway = process.env.ACTIVE_PAYMENT_GATEWAY || "duitku"

  if (!premiumSettingsCache || now - premiumSettingsCacheTime > CACHE_TTL) {
    // Try to get from database first
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

    // Update cache
    premiumSettingsCache = { premiumPrice, activeGateway }
    premiumSettingsCacheTime = now
  } else {
    // Use cached values
    premiumPrice = premiumSettingsCache.premiumPrice
    activeGateway = premiumSettingsCache.activeGateway
  }

  // Get user session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Error getting session:", sessionError)
    // Handle session error gracefully - continue as not logged in
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

  // Check if user is logged in
  const isLoggedIn = !!session

  // Get user data if logged in
  let isPremium = false
  let userName = ""
  let transaction = null

  if (isLoggedIn) {
    // Get authenticated user data - tidak perlu memanggil getUser() lagi karena sudah ada session
    const user = session.user

    if (!user) {
      console.error("Error: Session exists but no user found")
      // If user verification fails, treat as not logged in
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
