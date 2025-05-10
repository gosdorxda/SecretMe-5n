"use client"

import { useState } from "react"
import { BarChart3, Eye, MessageSquare, TrendingUp, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProfileStatisticsProps {
  viewCount: number
  messageCount: number
  isPremium: boolean
}

export function ProfileStatistics({ viewCount, messageCount, isPremium }: ProfileStatisticsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format numbers with thousand separators
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  return (
    <div className="w-full mb-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <h3 className="text-sm font-medium">Statistik Profil</h3>
        </div>
        <button
          className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          aria-label={isExpanded ? "Sembunyikan statistik" : "Tampilkan statistik"}
        >
          <TrendingUp className="h-4 w-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className="bg-white/50 rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Kunjungan</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Jumlah kunjungan ke profil Anda</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(viewCount)}</p>
            {isPremium && (
              <p className="text-xs text-gray-500 mt-1">
                {/* Placeholder for premium stats */}
                Rata-rata: 10/hari
              </p>
            )}
          </div>

          <div className="bg-white/50 rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1.5 rounded-full">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-medium">Pesan</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Jumlah pesan yang Anda terima</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(messageCount)}</p>
            {isPremium && (
              <p className="text-xs text-gray-500 mt-1">
                {/* Placeholder for premium stats */}
                Rasio: {messageCount > 0 && viewCount > 0 ? `${Math.round((messageCount / viewCount) * 100)}%` : "0%"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
