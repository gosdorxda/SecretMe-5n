"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Crown, ChevronDown, ChevronUp, ImageIcon, Edit3, Share2, BarChart3 } from "lucide-react"
import Link from "next/link"

export function PremiumFeatureTeaser() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="w-full mb-6 mt-2">
      <div
        className="flex items-center justify-between p-2 border-2 border-dashed border-amber-400 rounded-lg bg-amber-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">Lihat fitur Premium</span>
        </div>
        <button
          className="text-amber-700"
          aria-label={isExpanded ? "Sembunyikan fitur premium" : "Tampilkan fitur premium"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2 p-3 border border-gray-200 rounded-lg bg-white/80 shadow-sm animate-in fade-in slide-in-from-top-5 duration-300">
          <h4 className="font-semibold text-sm mb-3">Upgrade ke Premium dan dapatkan:</h4>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-start gap-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Foto Profil Kustom</p>
                <p className="text-xs text-gray-500">Upload foto profil pilihan Anda</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                <Edit3 className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Bio Profil</p>
                <p className="text-xs text-gray-500">Tambahkan deskripsi tentang diri Anda</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                <Share2 className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Username Kustom</p>
                <p className="text-xs text-gray-500">Ganti ID numerik dengan username pilihan</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Statistik Lanjutan</p>
                <p className="text-xs text-gray-500">Analisis detail kunjungan & pesan</p>
              </div>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-none"
          >
            <Link href="/premium">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Sekarang
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
