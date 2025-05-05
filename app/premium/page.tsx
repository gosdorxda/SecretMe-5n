import { createClient } from "@/lib/supabase/server"
import { PremiumClient } from "./client"

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

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

  if (isLoggedIn) {
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
