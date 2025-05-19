"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useLanguage } from "@/lib/i18n/language-context"
import type { Locale } from "@/lib/i18n/translations"

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const { locale, changeLocale } = useLanguage()

  // Function to handle language change
  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return

    // Get the current path without the language prefix
    let newPath = pathname
    if (pathname.startsWith("/en")) {
      newPath = pathname.replace(/^\/en/, "")
      if (newPath === "") newPath = "/"
    }

    // Add the new language prefix if needed
    if (newLocale === "en") {
      newPath = `/en${newPath === "/" ? "" : newPath}`
    }

    // Navigate to the new path
    router.push(newPath)
    changeLocale(newLocale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Image
            src={locale === "en" ? "/flags/US.svg" : "/flags/ID.svg"}
            alt={locale === "en" ? "English" : "Indonesia"}
            width={24}
            height={24}
            className="rounded-sm"
          />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange("id")} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <Image src="/flags/ID.svg" alt="Indonesia" width={20} height={20} className="rounded-sm" />
            <span>Indonesia</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("en")} className="cursor-pointer">
          <div className="flex items-center gap-2">
            <Image src="/flags/US.svg" alt="English" width={20} height={20} className="rounded-sm" />
            <span>English</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
