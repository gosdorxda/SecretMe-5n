"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"

export function LanguageToggle() {
  const { locale, changeLocale } = useLanguage()

  const toggleLanguage = () => {
    changeLocale(locale === "id" ? "en" : "id")
  }

  return (
    <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleLanguage}>
      <Globe className="h-5 w-5 text-[var(--text)]" />
      <span className="sr-only">{locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}</span>
    </Button>
  )
}
