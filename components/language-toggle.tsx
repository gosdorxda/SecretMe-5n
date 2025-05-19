"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/language-context"
import Image from "next/image"

export function LanguageToggle() {
  const { locale, changeLocale } = useLanguage()

  const toggleLanguage = () => {
    changeLocale(locale === "id" ? "en" : "id")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full relative overflow-hidden w-8 h-8 p-0"
      onClick={toggleLanguage}
      aria-label={locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
    >
      <div className="relative w-6 h-6">
        <Image
          src={locale === "id" ? "/flags/EN.png" : "/flags/ID.svg"}
          alt={locale === "id" ? "English" : "Indonesia"}
          fill
          className="object-cover"
        />
      </div>
      <span className="sr-only">{locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}</span>
    </Button>
  )
}
