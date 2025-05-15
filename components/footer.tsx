import { cn } from "@/lib/utils"
import Link from "next/link"

export function Footer({ className, minimal = false }: { className?: string; minimal?: boolean }) {
  const currentYear = new Date().getFullYear()

  // If minimal is true, return a simplified footer
  if (minimal) {
    return (
      <footer className={cn("w-full border-t-3 border-t-[var(--border)] py-4 px-4 mt-6", className)}>
        <div className="container mx-auto flex flex-col items-center justify-center text-sm">
          <p className="text-xs text-muted-foreground">&copy; {currentYear} SecretMe</p>
        </div>
      </footer>
    )
  }

  // Original footer with links for non-dashboard pages
  return (
    <footer className={cn("w-full border-t-[3px] border-t-[var(--border)] py-4 px-4 md:px-6 mt-8", className)}>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between py-2">
          {/* Left: Logo and Project Title */}
          <div className="flex items-center mb-4 md:mb-0">
            <h2 className="text-lg font-bold">SecretMe</h2>
          </div>

          {/* Center: Slogan */}
          <div className="text-center mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground italic">"Bagikan pesan rahasia dengan aman dan menyenangkan"</p>
          </div>

          {/* Right: Telegram Mini Form - Smaller with border */}
          <div className="flex items-center">
            <div className="bg-white border-2 border-[#0088cc] rounded-md shadow-sm overflow-hidden flex items-center">
              <div className="bg-[#0088cc] p-1.5 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="telegram-icon"
                >
                  <path d="M21.5 4.5L2.5 12.5L11.5 14.5L14.5 21.5L21.5 4.5Z"></path>
                  <path d="M11.5 14.5L14.5 21.5"></path>
                  <path d="M11.5 14.5L16.5 9.5"></path>
                </svg>
              </div>
              <Link
                href="https://linktr.ee/maskripto"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs text-gray-700 hover:text-[#0088cc] transition-colors"
                aria-label="Telegram"
              >
                @maskripto
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom: Links and Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-gray-200 mt-2">
          <div className="text-xs text-muted-foreground mb-2 md:mb-0">
            &copy; {currentYear} SecretMe. All rights reserved.
          </div>
          <nav className="flex flex-wrap justify-center gap-y-2">
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
              Terms
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
              Privacy
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
              Contact
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
              About
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
