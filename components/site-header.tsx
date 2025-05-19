"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "@/lib/i18n/language-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const { t, locale, changeLocale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

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
          {/* Language Toggle Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full">
                <span className="text-sm font-medium">{locale === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLocale("id")} className={locale === "id" ? "bg-gray-100" : ""}>
                <span className="flex items-center gap-2">
                  <span>🇮🇩</span>
                  <span>Bahasa Indonesia</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLocale("en")} className={locale === "en" ? "bg-gray-100" : ""}>
                <span className="flex items-center gap-2">
                  <span>🇬🇧</span>
                  <span>English</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!loading && !session ? (
            <Button className="rounded-full" size="sm" asChild>
              <Link href={locale === "en" ? "/en/register" : "/register"}>
                {locale === "en" ? t.common.register : "Mulai Sekarang"}
              </Link>
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
