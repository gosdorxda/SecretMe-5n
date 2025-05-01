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

  if (isLoggedIn) {
    // Get user data
    const { data: userData } = await supabase
      .from("users")
      .select("name, is_premium")
      .eq("id", session.user.id)
      .single()

    if (userData) {
      isPremium = userData.is_premium || false
      userName = userData.name || ""
    }

    // Get latest transaction
    const { data: transactionData } = await supabase
      .from("premium_transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (transactionData) {
      transaction = transactionData
    }
  }

  // Get premium price from config or env
  const { data: configData } = await supabase
    .from("site_config")
    .select("config")
    .eq("type", "premium_settings")
    .single()

  const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

  // Get active gateway from config
  const { data: gatewayConfigData } = await supabase
    .from("site_config")
    .select("config")
    .eq("type", "premium_settings")
    .single()

  // Default to duitku if no config found
  const activeGateway = gatewayConfigData?.config?.activeGateway || "duitku"

  // Get URL parameters for status
  const urlStatus = searchParams.status as string | undefined
  const urlOrderId = searchParams.order_id as string | undefined

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
