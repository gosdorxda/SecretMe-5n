import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { StickyNotificationProvider } from "@/components/sticky-notification-provider"
import { FooterProvider } from "@/components/footer-provider"
import I18nProvider from "@/components/i18n-provider"

export const metadata: Metadata = {
  title: "SecretMe - Pesan Anonim",
  description: "Platform untuk menerima pesan anonim dari siapa saja",
    generator: 'v0.dev'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <I18nProvider>
          <AuthProvider>
            <StickyNotificationProvider>
              <FooterProvider>
                <div className="relative flex min-h-screen flex-col">
                  <SiteHeader />
                  <div className="flex-1">{children}</div>
                  <Footer />
                </div>
                <Toaster />
              </FooterProvider>
            </StickyNotificationProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
