"use client"

import { MessageSquare } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

interface LoadingScreenProps {
  message?: string
  loadingKey?: keyof Translation["loading"]
}

export function LoadingScreen({ message = "Memuat...", loadingKey = "default" }: LoadingScreenProps) {
  const { locale } = useLanguage()

  // Gunakan terjemahan jika tersedia
  const displayMessage =
    loadingKey && translations[locale]?.loading?.[loadingKey] ? translations[locale].loading[loadingKey] : message

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg)] z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo dengan styling yang selaras dengan navigasi */}
        <div className="w-16 h-16 rounded-[var(--border-radius)] bg-[var(--main)] border-2 border-[var(--border)] flex items-center justify-center shadow-[var(--shadow)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
          <MessageSquare className="w-8 h-8 text-[var(--mtext)]" />
        </div>

        {/* Teks loading dengan animasi titik */}
        <div className="text-center mt-4">
          <p className="text-lg font-medium">{displayMessage}</p>
        </div>

        {/* Loading bar sederhana */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-[var(--main)] animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}

// Import translations untuk digunakan dalam komponen
import { translations } from "@/lib/i18n/translations"
import type { Translation } from "@/lib/i18n/translations"
