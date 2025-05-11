"use client"

import { useState } from "react"
import Link from "next/link"
import { Crown, Sparkles, Star, Zap, X } from "lucide-react"
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
    <div className="w-full mb-6 overflow-hidden">
      <div className="relative bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-2 border-amber-300 rounded-xl p-4 shadow-neo">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
          <div className="absolute -top-4 -left-4 w-20 h-20 bg-yellow-400 rounded-full"></div>
          <div className="absolute top-10 right-10 w-16 h-16 bg-amber-300 rounded-full"></div>
          <div className="absolute bottom-5 left-1/4 w-12 h-12 bg-yellow-300 rounded-full"></div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full text-amber-600 transition-colors"
          aria-label="Tutup banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col md:flex-row items-center gap-4 z-10 relative">
          <div className="flex-shrink-0 bg-amber-400 p-3 rounded-full">
            <Crown className="h-8 w-8 text-white" />
          </div>

          <div className="flex-grow text-center md:text-left">
            <h3 className="text-lg font-bold text-amber-800 flex items-center justify-center md:justify-start gap-1">
              Upgrade ke Premium
              <Sparkles className="h-4 w-4 text-amber-500" />
            </h3>
            <p className="text-amber-700 mb-3">
              Dapatkan fitur eksklusif: username kustom, foto profil, bio, link sosial media, dan banyak lagi!
            </p>

            <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                <Star className="h-3 w-3 mr-1" /> Username Kustom
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                <Star className="h-3 w-3 mr-1" /> Foto Profil
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                <Star className="h-3 w-3 mr-1" /> Bio Profil
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                <Star className="h-3 w-3 mr-1" /> Link Sosial Media
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button asChild variant="warning" size="lg" className="neo-btn gap-1 animate-pulse">
              <Link href="/premium">
                <Zap className="h-4 w-4 mr-1" />
                <span>Upgrade Sekarang</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
