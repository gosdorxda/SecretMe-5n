"use client"

import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n/language-context"
import { cn } from "@/lib/utils"

interface PremiumPromoBannerProps {
  className?: string
  variant?: "default" | "prominent" | "compact"
}

export function PremiumPromoBanner({ className, variant = "default" }: PremiumPromoBannerProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "text-center",
        variant === "prominent"
          ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg shadow-sm"
          : variant === "compact"
            ? "bg-blue-50 border border-blue-200 p-2 rounded-md"
            : "bg-blue-50 border border-blue-200 p-3 rounded-md",
        className,
      )}
    >
      <p className={cn("font-medium", variant === "compact" ? "text-xs sm:text-sm" : "text-sm")}>
        {t.promotions?.premiumCode?.split("SECRETME2025")[0] || "Use code "}
        <Badge
          className={cn(
            "mx-1 font-mono font-bold",
            variant === "prominent" && "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0",
          )}
          variant="outline"
          size={variant === "compact" ? "sm" : "default"}
        >
          SECRETME2025
        </Badge>
        {t.promotions?.premiumCode?.split("SECRETME2025")[1] || " to get premium access for free!"}
      </p>
    </div>
  )
}
