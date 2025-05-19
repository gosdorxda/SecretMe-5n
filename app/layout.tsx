import type React from "react"
import "./globals.css"
import { Toaster } from "@/components/toaster"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { StickyNotificationProvider } from "@/components/sticky-notification-provider"
import { FooterProvider } from "@/components/footer-provider"
import { LanguageProvider } from "@/lib/i18n/language-context"

export const metadata = {
  title: "SecretMe - Pesan Anonim",
  description: "Terima pesan anonim dari siapapun. Dapatkan feedback jujur dari teman dan rekan kerja Anda.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <LanguageProvider>
          <StickyNotificationProvider>
            <FooterProvider>
              <SiteHeader />
              <main>{children}</main>
              <Footer />
              <Toaster />
            </FooterProvider>
          </StickyNotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
