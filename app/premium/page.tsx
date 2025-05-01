import { createClient } from "@/lib/supabase/server"
import { PremiumClient } from "./client"
import { getLatestTransaction } from "./actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
  let userName = ""
  let isPremium = false
  let transaction = null
  // Add this line to the existing code to get the user email
  const userEmail = session?.user?.email || ""

  if (isLoggedIn) {
    // Get user data
    const { data: userData } = await supabase
      .from("users")
      .select("name, is_premium")
      .eq("id", session.user.id)
      .single()

    if (userData) {
      userName = userData.name || session.user.email?.split("@")[0] || "User"
      isPremium = userData.is_premium || false
    }

    // Get latest transaction
    const result = await getLatestTransaction()
    if (result.success && result.hasTransaction) {
      transaction = result.transaction
    }
  }

  // Get premium price from config or env
  const { data: configData } = await supabase
    .from("site_config")
    .select("config")
    .eq("type", "premium_settings")
    .single()

  const premiumPrice = configData?.config?.price || Number.parseInt(process.env.PREMIUM_PRICE || "49000")

  // Get URL parameters
  const urlStatus = searchParams.status as string | undefined
  const urlOrderId = searchParams.order_id as string | undefined

  // Then update the return statement to include userEmail in the props
  return (
    <PremiumClient
      isLoggedIn={isLoggedIn}
      isPremium={isPremium}
      userName={userName}
      userEmail={userEmail}
      premiumPrice={premiumPrice}
      urlStatus={urlStatus}
      urlOrderId={urlOrderId}
      transaction={transaction}
    />
  )
}
