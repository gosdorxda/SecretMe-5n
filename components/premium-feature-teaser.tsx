"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Crown, ChevronDown, ChevronUp, Check, X } from "lucide-react"
import Link from "next/link"

export function PremiumFeatureTeaser() {
  const [isExpanded, setIsExpanded] = useState(false)

  const features = [
    { name: "Kirim & terima pesan anonim", free: true, premium: true },
    { name: "Username kustom", free: false, premium: true },
    { name: "Foto profil kustom", free: false, premium: true },
    { name: "Bio profil", free: false, premium: true },
    { name: "Link media sosial", free: false, premium: true },
    { name: "Statistik kunjungan & pesan", free: false, premium: true },
    { name: "Manajemen balasan publik", free: false, premium: true },
    { name: "Notifikasi WhatsApp/Telegram", free: false, premium: true },
    { name: "Tema profil kustom", free: false, premium: true },
    { name: "Prioritas dukungan", free: false, premium: true },
    { name: "Tanpa iklan", free: false, premium: true },
  ]

  return (
    <div className="w-full mb-4 mt-2">
      <div className="flex flex-col">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <div className="flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Perbandingan fitur</span>
          </div>
          <div className="text-gray-500">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-2 px-3 text-left font-medium text-gray-500">Fitur</th>
                    <th className="py-2 px-3 text-center font-medium text-gray-500">Gratis</th>
                    <th className="py-2 px-3 text-center font-medium text-gray-500 bg-amber-50">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="py-2 px-3 border-b">{feature.name}</td>
                      <td className="py-2 px-3 text-center border-b">
                        {feature.free ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="py-2 px-3 text-center border-b bg-amber-50">
                        {feature.premium && <Check className="h-4 w-4 text-green-600 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              asChild
              size="sm"
              className="mt-3 w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
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
