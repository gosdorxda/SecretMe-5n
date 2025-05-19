"use client"

import { BrandBadge } from "@/components/brand-badge"
import { useLanguage } from "@/lib/i18n/language-context"
import { type Locale, translations } from "@/lib/i18n/translations"

export function BrandBadgeDemo() {
  const { locale } = useLanguage()
  const t = translations[locale as Locale]

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Default Badge</h3>
        <p className="flex items-center gap-2">
          {t.branding?.tagline} <BrandBadge />
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Outline Badge</h3>
        <p className="flex items-center gap-2">
          {t.branding?.tagline} <BrandBadge variant="outline" />
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Prominent Badge</h3>
        <p className="flex items-center gap-2">
          {t.branding?.tagline} <BrandBadge variant="prominent" />
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Different Sizes</h3>
        <div className="flex items-center gap-2">
          <BrandBadge size="sm" />
          <BrandBadge />
          <BrandBadge size="lg" />
        </div>
      </div>
    </div>
  )
}
