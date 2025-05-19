"use client"

import { Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function LanguageToggle() {
  const { locale, changeLocale } = useLanguage()

  const toggleLanguage = () => {
    changeLocale(locale === "id" ? "en" : "id")
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 text-sm font-medium"
      aria-label={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
    >
      <Globe className="h-4 w-4" />
      <span className="hidden sm:inline">{locale === "id" ? "EN" : "ID"}</span>
    </button>
  )
}
