import { createClient } from "@/lib/supabase/server"
import { PremiumClient } from "./client"

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createClient()

  try {
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

    // Get premium price and active gateway from database first, then fallback to env
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

    // Get URL parameters for status
    const urlStatus = searchParams.status as string | undefined
    const urlOrderId = searchParams.order_id as string | undefined

    console.log("Premium page data:", {
      isLoggedIn,
      isPremium,
      userName,
      premiumPrice,
      activeGateway,
      hasTransaction: !!transaction,
    })

    return (
      <PremiumClient
        isLoggedIn={isLoggedIn}
        isPremium={isPremium}
        userName={userName}
        premiumPrice={premiumPrice}
        urlStatus={urlStatus}
        urlOrderId={urlOrderId}
        transaction={transaction}
        activeGateway={activeGateway}
      />
    )
  } catch (error) {
    console.error("Error in premium page:", error)
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-4">
            Maaf, terjadi kesalahan saat memuat halaman premium. Silakan coba lagi nanti atau hubungi administrator.
          </p>
          <div className="mt-6">
            <a href="/dashboard" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Kembali ke Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }
}
