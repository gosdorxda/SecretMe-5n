"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { useRouter } from "next/navigation"
import { MessageSquare, Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const pathname = usePathname()
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const { locale, changeLocale, t } = useLanguage()

  return (
    <header className="w-full py-4 bg-[var(--bg)]">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4">
        <Link href={locale === "en" ? "/en" : "/"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--border-radius)] bg-[var(--main)] border-2 border-[var(--border)] shadow-neo-sm">
            <MessageSquare className="h-4 w-4 text-[var(--mtext)]" />
          </div>
          <span className="font-bold text-lg text-[var(--text)]">SecretMe</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-5 w-5" />
                <span className="sr-only">{t.nav.language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLocale("id")} className={locale === "id" ? "bg-muted" : ""}>
                🇮🇩 Indonesia
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLocale("en")} className={locale === "en" ? "bg-muted" : ""}>
                🇬🇧 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!loading && !session ? (
            <Button className="rounded-full" size="sm" asChild>
              <Link href={locale === "en" ? "/en/register" : "/register"}>{t.common.getStarted}</Link>
            </Button>
          ) : (
            <Button className="rounded-full" size="sm" asChild>
              <Link href={locale === "en" ? "/en/dashboard" : "/dashboard"}>{t.common.dashboard}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
