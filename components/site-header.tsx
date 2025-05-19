"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { MessageSquare, Globe } from "lucide-react"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useLanguage } from "@/lib/i18n/language-context"

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

  // Function to toggle language
  const toggleLanguage = () => {
    changeLocale(locale === "id" ? "en" : "id")
  }

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
          {/* Language Toggle Button */}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleLanguage}>
            <Globe className="h-5 w-5 text-[var(--text)]" />
            <span className="sr-only">{locale === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}</span>
          </Button>

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
