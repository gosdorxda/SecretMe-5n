import { cn } from "@/lib/utils"
import Link from "next/link"
import { Github, Twitter, Instagram } from "lucide-react"

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

          {/* Right: Social Media Links */}
          <div className="flex space-x-3">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--bw)] p-2 rounded-[var(--border-radius)] border-2 border-[var(--border)] hover:shadow-none transition-all duration-200"
              aria-label="GitHub"
            >
              <Github size={18} />
            </Link>
            <Link
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--bw)] p-2 rounded-[var(--border-radius)] border-2 border-[var(--border)] hover:shadow-none transition-all duration-200"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </Link>
            <Link
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[var(--bw)] p-2 rounded-[var(--border-radius)] border-2 border-[var(--border)] hover:shadow-none transition-all duration-200"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </Link>
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
