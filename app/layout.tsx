import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/toaster"
import { EnvironmentDetector } from "@/components/environment-detector"
import { AuthProvider } from "@/components/auth-provider"
import { SiteHeader } from "@/components/site-header"
import { SeoMeta } from "@/components/seo-meta"
import { StickyNotificationProvider } from "@/components/sticky-notification-provider"
import { FooterProvider } from "@/components/footer-provider"
import { LanguageProvider } from "@/lib/i18n/language-context"
// Impor AuthTroubleshooter
import { AuthTroubleshooter } from "@/components/auth-troubleshooter"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SecretMe - Platform Pesan Anonim",
  description: "Terima pesan anonim dari siapapun dengan mudah dan aman",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* SeoMeta tetap di sini, tapi sekarang menggunakan client-side rendering */}
        <SeoMeta />
        {/* Histats.com  START  */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
var _Hasync= _Hasync|| [];
_Hasync.push(['Histats.start', '1,4951418,4,0,0,0,00010000']);
_Hasync.push(['Histats.fasi', '1']);
_Hasync.push(['Histats.track_hits', '']);
(function() {
  var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
  hs.src = ('//s10.histats.com/js15_as.js');
  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
})();
`,
          }}
        />
        {/* Histats.com  END  */}
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <EnvironmentDetector>
              <StickyNotificationProvider>
                <AuthTroubleshooter /> {/* Tambahkan komponen ini */}
                <FooterProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <SiteHeader />
                    <main className="flex-1 w-full">{children}</main>
                  </div>
                </FooterProvider>
                <Toaster />
              </StickyNotificationProvider>
            </EnvironmentDetector>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
