import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="w-full max-w-[56rem] mx-auto flex flex-col items-center justify-center min-h-screen py-8 px-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Halaman Tidak Ditemukan</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Maaf, halaman yang Anda cari tidak ditemukan. Halaman mungkin telah dipindahkan atau dihapus.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Masuk</Link>
        </Button>
      </div>
    </div>
  )
}
