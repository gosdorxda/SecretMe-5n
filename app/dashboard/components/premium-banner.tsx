"use client"

import { useState } from "react"
import Link from "next/link"
import { Crown, Zap, X, Eye, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]

interface PremiumBannerProps {
  user: UserType
}

export function PremiumBanner({ user }: PremiumBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (user.is_premium || isDismissed) return null

  return (
    <div className="w-full mb-6">
      <div className="relative bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 shadow-sm">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 hover:bg-amber-100 rounded-full text-amber-500 transition-colors"
          aria-label="Tutup banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-amber-400 p-1.5 rounded-full">
              <Crown className="h-4 w-4 text-white" />
            </div>

            <div className="flex-grow text-sm text-amber-800">Upgrade ke Premium untuk fitur eksklusif</div>

            <div className="flex-shrink-0">
              <Button asChild variant="warning" size="sm" className="h-8 px-3 gap-1">
                <Link href="/premium">
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  <span>Upgrade</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <Link href="https://secretme.site/anitawijaya" target="_blank" rel="noopener noreferrer">
                <Eye className="h-3 w-3 mr-1" />
                <span>Lihat Profil Demo</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <Link href="/features">
                <Sparkles className="h-3 w-3 mr-1" />
                <span>Cek Fitur Premium</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
