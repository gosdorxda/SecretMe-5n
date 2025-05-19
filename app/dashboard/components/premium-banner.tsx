"use client"

import { useState } from "react"
import Link from "next/link"
import { Crown, Zap, X, Eye, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Database } from "@/lib/supabase/database.types"
import { useMobile } from "@/hooks/use-mobile"
import { useLanguage } from "@/lib/i18n/language-context"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface PremiumBannerProps {
  user: UserType
}

export function PremiumBanner({ user }: PremiumBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const isMobile = useMobile()
  const { locale, translations } = useLanguage()

  if (user.is_premium || isDismissed) return null

  // Prefix path with locale for English
  const getLocalizedPath = (path: string) => {
    return locale === "en" ? `/en${path}` : path
  }

  // Fallback texts in case translations are not available
  const fallbackTexts = {
    exclusiveFeatures: "Fitur Eksklusif",
    demoProfile: "Profil Demo",
    checkFeatures: "Cek Fitur",
    upgrade: "Upgrade",
    closeBanner: "Tutup banner",
  }

  // Safely access translations or use fallbacks
  const getText = (key: keyof typeof fallbackTexts) => {
    try {
      if (translations?.premiumBanner?.[key]) {
        return translations.premiumBanner[key]
      }
      return fallbackTexts[key]
    } catch (error) {
      return fallbackTexts[key]
    }
  }

  return (
    <div className="w-full mb-6">
      <div className="relative bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 bg-amber-400 p-1.5 rounded-full">
              <Crown className="h-3.5 w-3.5 text-white" />
            </div>
            {!isMobile && <span className="text-xs font-medium text-amber-800">{getText("exclusiveFeatures")}</span>}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 shadow-none"
            >
              <Link href="https://secretme.site/anitawijaya" target="_blank" rel="noopener noreferrer">
                <Eye className="h-3 w-3 mr-1" />
                <span>{getText("demoProfile")}</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 shadow-none"
            >
              <Link href={getLocalizedPath("/features")}>
                <Sparkles className="h-3 w-3 mr-1" />
                <span>{getText("checkFeatures")}</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-amber-500 border-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 shadow-none"
            >
              <Link href={getLocalizedPath("/premium")}>
                <Zap className="h-3 w-3 mr-1" />
                <span>{getText("upgrade")}</span>
              </Link>
            </Button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-amber-100 rounded-full text-amber-500 transition-colors"
              aria-label={getText("closeBanner")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
