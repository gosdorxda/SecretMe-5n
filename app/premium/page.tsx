import { createClient } from "@/lib/supabase/server"
import { PremiumClient } from "./client"

export const dynamic = "force-dynamic"

export default async function PremiumPage() {
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

  // If logged in, get user data
  if (isLoggedIn) {
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

  return <PremiumClient isLoggedIn={isLoggedIn} isPremium={isPremium} userName={userName} premiumPrice={premiumPrice} />
}
