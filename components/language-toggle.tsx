"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mengubah dari export default menjadi export bernama
export function LanguageToggle() {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  // Pastikan komponen hanya dirender di sisi klien
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
        <Globe className="h-5 w-5" />
      </Button>
    )
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("id")} className={i18n.language === "id" ? "bg-gray-100" : ""}>
          <span className="mr-2">🇮🇩</span> Bahasa Indonesia
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("en")} className={i18n.language === "en" ? "bg-gray-100" : ""}>
          <span className="mr-2">🇬🇧</span> English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
