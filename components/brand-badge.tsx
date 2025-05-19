"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-context"
import { type Locale, translations } from "@/lib/i18n/translations"

interface BrandBadgeProps {
  className?: string
  variant?: "default" | "outline" | "prominent"
  size?: "default" | "sm" | "lg"
}

export function BrandBadge({ className, variant = "default", size = "default" }: BrandBadgeProps) {
  const { locale } = useLanguage()
  const t = translations[locale as Locale]

  // Choose different styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return "bg-transparent border-2 border-blue-500 text-blue-600"
      case "prominent":
        return "bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white font-bold shadow-md hover:shadow-lg"
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200"
    }
  }

  // Choose different sizing
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-0.5"
      case "lg":
        return "text-base px-3 py-1"
      default:
        return "text-sm px-2.5 py-0.5"
    }
  }

  return (
    <Badge
      className={cn("rounded-md font-medium transition-all", getVariantStyles(), getSizeStyles(), className)}
      variant="outline"
    >
      {t.branding?.appName || "SECRETME2025"}
    </Badge>
  )
}
