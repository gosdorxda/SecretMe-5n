import { createClient } from "@/lib/supabase/server"
import { PremiumClient } from "./client"
import { getLatestTransaction } from "./actions"

export const dynamic = "force-dynamic"

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

  const isLoggedIn = !!session
  let isPremium = false
  let userName = ""

  // Get premium price from config or env
  const { data: configData } = await supabase
    .from("site_config")
    .select("config")
    .eq("type", "premium_settings")
    .single()

  const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

  // Get transaction status from URL if available
  const status = searchParams.status as string | undefined
  const orderId = searchParams.order_id as string | undefined

  // Get latest transaction data
  let transactionData = null
  if (isLoggedIn) {
    const result = await getLatestTransaction()
    if (result.success) {
      if (result.isPremium) {
        isPremium = true
      } else if (result.hasTransaction) {
        transactionData = result.transaction
      }
    }

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
  }

  return (
    <PremiumClient
      isLoggedIn={isLoggedIn}
      isPremium={isPremium}
      userName={userName}
      premiumPrice={premiumPrice}
      urlStatus={status}
      urlOrderId={orderId}
      transaction={transactionData}
    />
  )
}
