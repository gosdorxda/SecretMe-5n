"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, ChevronDown, ChevronUp, Check, X, Lock, Camera, User, FileText, Link } from "lucide-react"
import LinkComponent from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export function PremiumFeatureTeaser() {
  const [isExpanded, setIsExpanded] = useState(false)

  const features = [
    {
      name: "Kirim & terima pesan anonim",
      free: true,
      premium: true,
      popular: false,
    },
    {
      name: "Username kustom permanen selamanya",
      free: false,
      premium: true,
      popular: true,
    },
    {
      name: "Foto profil kustom & bio lengkap",
      free: false,
      premium: true,
      popular: false,
    },
    {
      name: "Link media sosial (Instagram, Twitter, dll)",
      free: false,
      premium: true,
      popular: false,
    },
    {
      name: "Notifikasi WhatsApp & Telegram tanpa batas",
      free: false,
      premium: true,
      popular: true,
    },
    {
      name: "Statistik lengkap kunjungan & pesan",
      free: false,
      premium: true,
      popular: false,
    },
    {
      name: "Manajemen balasan publik",
      free: false,
      premium: true,
      popular: false,
    },
    {
      name: "Tema profil kustom & kartu pesan",
      free: false,
      premium: true,
      popular: true,
    },
    {
      name: "Hapus pesan yang tidak diinginkan",
      free: false,
      premium: true,
      popular: true,
    },
    {
      name: "Berbagi gambar profil dengan QR code",
      free: false,
      premium: true,
      popular: false,
    },
    {
      name: "Tanpa iklan & prioritas dukungan seumur hidup",
      free: false,
      premium: true,
      popular: false,
    },
    {
      name: "Semua update fitur premium di masa depan",
      free: false,
      premium: true,
      popular: false,
    },
  ]

  return (
    <div className="w-full mb-4 mt-2">
      {/* Feature comparison dropdown button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2.5 px-3 text-sm font-medium text-amber-800 hover:text-amber-900 bg-amber-50 border border-amber-200 rounded-lg focus:outline-none"
      >
        <div className="flex items-center gap-1.5">
          <Crown className="h-4 w-4 text-amber-500" />
          <span>Fitur Premium Tersedia</span>
        </div>
        <div className="text-amber-500">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Locked Premium Features Card - Moved inside dropdown */}
          <Card className="mb-4 overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-0">
              <div className="relative">
                {/* Locked Overlay */}
                <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="bg-white/90 rounded-full p-2 shadow-lg">
                    <Lock className="h-6 w-6 text-amber-500" />
                  </div>
                </div>

                {/* Premium Features Preview */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-amber-800 flex items-center">
                      <Crown className="h-4 w-4 mr-1.5 text-amber-500" />
                      Fitur Premium Terkunci
                    </h3>
                    <Badge className="bg-amber-500 hover:bg-amber-600">Upgrade Sekarang</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex flex-col items-center p-2 bg-white/60 rounded-lg border border-amber-200">
                      <Camera className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="text-xs text-center text-amber-800">Foto Profil Kustom</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/60 rounded-lg border border-amber-200">
                      <User className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="text-xs text-center text-amber-800">Username Kustom</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/60 rounded-lg border border-amber-200">
                      <FileText className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="text-xs text-center text-amber-800">Bio Lengkap</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex flex-col items-center p-2 bg-white/60 rounded-lg border border-amber-200">
                      <Link className="h-5 w-5 text-amber-500 mb-1" />
                      <span className="text-xs text-center text-amber-800">Link Sosial Media</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/60 rounded-lg border border-amber-200">
                      <svg
                        className="h-5 w-5 text-amber-500 mb-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.5 13.5L6.5 17.5L9.5 16.5L12.5 19.5L14 13.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14.5 7.5C14.5 7.5 13 10 12 10C11 10 9.5 7.5 9.5 7.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-xs text-center text-amber-800">Notifikasi Telegram</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-white/60 rounded-lg border border-amber-200">
                      <svg
                        className="h-5 w-5 text-amber-500 mb-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 21L3.81 17.49C2.67 15.59 2.24 13.39 2.58 11.23C2.92 9.08 3.99 7.12 5.61 5.67C7.23 4.22 9.3 3.37 11.46 3.27C13.62 3.17 15.76 3.83 17.5 5.13C19.24 6.43 20.49 8.28 21.04 10.4C21.6 12.52 21.41 14.77 20.51 16.76C19.61 18.75 18.06 20.35 16.1 21.33C14.15 22.32 11.91 22.62 9.76 22.2C7.62 21.79 5.68 20.68 4.24 19.03L3 21Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 14.5L11 16.5L15 11.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-xs text-center text-amber-800">Notifikasi WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature comparison table */}
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
                    <td className="py-2 px-3 border-b">
                      <div className="flex items-center gap-1.5">
                        {feature.name}
                        {feature.popular && (
                          <Badge className="ml-1.5 bg-orange-500 hover:bg-orange-600 text-[10px] px-1.5 py-0">
                            Populer
                          </Badge>
                        )}
                      </div>
                    </td>
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

          {/* Upgrade button */}
          <Button
            asChild
            size="sm"
            className="mt-3 w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
          >
            <LinkComponent href="/premium">
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Upgrade ke Premium
            </LinkComponent>
          </Button>
        </div>
      )}
    </div>
  )
}
