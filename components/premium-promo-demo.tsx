import { PremiumPromoBanner } from "@/components/premium-promo-banner"

export function PremiumPromoDemo() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Default Promo Banner</h2>
      <PremiumPromoBanner />

      <h2 className="text-xl font-bold mt-8">Prominent Promo Banner</h2>
      <PremiumPromoBanner variant="prominent" />
    </div>
  )
}
