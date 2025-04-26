import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <h2 className="mb-6 text-2xl font-medium">Halaman Tidak Ditemukan</h2>
        <p className="mb-8 text-gray-600">Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.</p>
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  )
}
