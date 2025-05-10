"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Crown, ChevronDown, ChevronUp, ImageIcon, Edit3, Share2, BarChart3 } from "lucide-react"
import Link from "next/link"

export function PremiumFeatureTeaser() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="w-full mb-4 mt-2">
      <div className="flex flex-col">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <div className="flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Lihat fitur premium</span>
          </div>
          <div className="text-gray-500">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-2 pl-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
              <span>Foto profil kustom</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Edit3 className="h-3.5 w-3.5 text-amber-500" />
              <span>Bio profil</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Share2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Username kustom</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
              <span>Statistik lanjutan</span>
            </div>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-2 w-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            >
              <Link href="/premium">
                <Crown className="h-3.5 w-3.5 mr-1.5" />
                Upgrade ke Premium
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
