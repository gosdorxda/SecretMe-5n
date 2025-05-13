import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { SeoMeta } from "@/components/seo-meta"
import { Button } from "@/components/ui/button"
import {
  Crown,
  AtSign,
  User,
  FileText,
  Link2,
  MessageSquare,
  BarChart2,
  MessageCircle,
  Palette,
  Trash2,
  QrCode,
  Shield,
  Infinity,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Fitur Premium SecretMe - Tingkatkan Pengalaman Pesan Anonim Anda",
  description:
    "Jelajahi semua fitur premium SecretMe yang akan meningkatkan pengalaman pesan anonim Anda dengan berbagai kemampuan eksklusif.",
}

export default function FeaturesPage() {
  return (
    <>
      <SeoMeta
        title="Fitur Premium SecretMe - Tingkatkan Pengalaman Pesan Anonim Anda"
        description="Jelajahi semua fitur premium SecretMe yang akan meningkatkan pengalaman pesan anonim Anda dengan berbagai kemampuan eksklusif."
      />

      <div className="container max-w-6xl py-12 px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Fitur Premium SecretMe</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Jelajahi roadmap fitur premium kami yang dirancang untuk meningkatkan pengalaman pesan anonim Anda.
          </p>
        </div>

        {/* Roadmap Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full hidden md:block"></div>

          {/* Feature 1: Username Kustom */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-amber-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right order-2 md:order-1">
                <div className="inline-flex items-center justify-center p-2 bg-amber-100 rounded-full mb-4">
                  <AtSign className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Username Kustom Permanen</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Pilih username unik yang mencerminkan identitas Anda. Username ini akan menjadi bagian dari URL profil
                  Anda selamanya, memudahkan orang lain untuk menemukan dan mengingat profil Anda.
                </p>
                <div className="flex md:justify-end">
                  <span className="inline-block bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1 rounded-full">
                    FITUR POPULER
                  </span>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?key=65bqr"
                    alt="Username Kustom"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Personalisasi URL Profil Anda</h3>
                      <p>
                        secretme.com/<span className="text-amber-300">username-anda</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Foto Profil */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?key=b6qvd"
                    alt="Foto Profil Kustom"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Tampilkan Identitas Visual Anda</h3>
                      <p>Upload, crop, dan sesuaikan foto profil Anda</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Foto Profil Kustom</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Upload foto profil Anda untuk memberikan sentuhan personal pada halaman profil Anda. Buat kesan
                  pertama yang berkesan dan tingkatkan kredibilitas profil Anda dengan foto yang profesional.
                </p>
                <div className="flex">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    PERSONALISASI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Bio Lengkap */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right order-2 md:order-1">
                <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Bio Profil Lengkap</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Tambahkan deskripsi lengkap tentang diri Anda. Ceritakan siapa Anda, apa yang Anda sukai, atau apa
                  yang ingin orang ketahui tentang Anda. Bio yang menarik akan meningkatkan engagement profil Anda.
                </p>
                <div className="flex md:justify-end">
                  <span className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    EKSPRESI DIRI
                  </span>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?key=5l7dv"
                    alt="Bio Profil Lengkap"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Ceritakan Kisah Anda</h3>
                      <p>Editor bio lengkap dengan format rich text</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Link Sosial Media */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-purple-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?key=yj0rb"
                    alt="Link Sosial Media"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Hubungkan Semua Platform Anda</h3>
                      <p>Instagram, Twitter, Facebook, LinkedIn, TikTok, dan lainnya</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-full mb-4">
                  <Link2 className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Link Sosial Media</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Hubungkan profil sosial media Anda seperti Instagram, Twitter, Facebook, LinkedIn, dan TikTok untuk
                  memudahkan orang menemukan Anda di platform lain. Tingkatkan jangkauan dan koneksi Anda.
                </p>
                <div className="flex">
                  <span className="inline-block bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                    FITUR BARU
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5: Notifikasi */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right order-2 md:order-1">
                <div className="inline-flex items-center justify-center p-2 bg-cyan-100 rounded-full mb-4">
                  <MessageSquare className="h-6 w-6 text-cyan-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Notifikasi WhatsApp & Telegram</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Dapatkan notifikasi instan melalui WhatsApp dan Telegram setiap kali ada pesan baru. Tidak perlu lagi
                  memeriksa secara manual, Anda akan selalu mendapatkan pemberitahuan real-time.
                </p>
                <div className="flex md:justify-end">
                  <span className="inline-block bg-cyan-100 text-cyan-800 text-sm font-medium px-3 py-1 rounded-full">
                    FITUR POPULER
                  </span>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?key=8blec"
                    alt="Notifikasi WhatsApp & Telegram"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Notifikasi Real-time</h3>
                      <p>Terima pemberitahuan instan di WhatsApp dan Telegram Anda</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 6: Statistik */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-rose-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?height=600&width=800&query=professional analytics dashboard with visitor statistics and charts"
                    alt="Statistik Lengkap"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Analisis Mendalam</h3>
                      <p>Pantau kunjungan, pesan, dan interaksi profil Anda</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center justify-center p-2 bg-rose-100 rounded-full mb-4">
                  <BarChart2 className="h-6 w-6 text-rose-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Statistik Lengkap</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Akses statistik lengkap tentang kunjungan profil dan pesan yang Anda terima. Lihat tren dan pola untuk
                  memahami audiens Anda lebih baik dan optimalkan profil Anda berdasarkan data.
                </p>
                <div className="flex">
                  <span className="inline-block bg-rose-100 text-rose-800 text-sm font-medium px-3 py-1 rounded-full">
                    WAWASAN DATA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 7: Balasan Publik */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right order-2 md:order-1">
                <div className="inline-flex items-center justify-center p-2 bg-yellow-100 rounded-full mb-4">
                  <MessageCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Manajemen Balasan Publik</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Aktifkan balasan publik untuk pesan Anda. Buat percakapan terbuka dan interaktif dengan pengunjung
                  profil Anda, tingkatkan engagement, dan bangun komunitas di sekitar profil Anda.
                </p>
                <div className="flex md:justify-end">
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                    INTERAKTIVITAS
                  </span>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?height=600&width=800&query=professional public reply interface with comment threads and moderation tools"
                    alt="Manajemen Balasan Publik"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Percakapan Terbuka</h3>
                      <p>Kelola balasan publik dan moderasi komentar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 8: Tema Kustom */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-teal-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?height=600&width=800&query=professional theme customization interface with color palettes and preview"
                    alt="Tema Profil Kustom"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Desain Sesuai Brand Anda</h3>
                      <p>Pilih warna, font, dan layout yang mencerminkan identitas Anda</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center justify-center p-2 bg-teal-100 rounded-full mb-4">
                  <Palette className="h-6 w-6 text-teal-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Tema Profil Kustom</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Personalisasi tampilan profil dan kartu pesan Anda dengan berbagai tema dan warna. Buat profil Anda
                  menonjol dan unik dengan desain yang mencerminkan identitas atau brand Anda.
                </p>
                <div className="flex">
                  <span className="inline-block bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full">
                    FITUR BARU
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 9: Hapus Pesan */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right order-2 md:order-1">
                <div className="inline-flex items-center justify-center p-2 bg-red-100 rounded-full mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Hapus Pesan</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Hapus pesan yang tidak diinginkan atau tidak pantas. Anda memiliki kendali penuh atas konten yang ada
                  di profil Anda, memastikan pengalaman yang aman dan nyaman bagi Anda dan pengunjung.
                </p>
                <div className="flex md:justify-end">
                  <span className="inline-block bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                    KONTROL KONTEN
                  </span>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?height=600&width=800&query=professional message moderation interface with deletion confirmation"
                    alt="Hapus Pesan"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Moderasi Konten</h3>
                      <p>Hapus, filter, dan kelola pesan dengan mudah</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 10: QR Code */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?height=600&width=800&query=professional QR code generator with customization and download options"
                    alt="Berbagi Profil dengan QR Code"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Promosi Offline</h3>
                      <p>Generate, kustomisasi, dan download QR code profil Anda</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-full mb-4">
                  <QrCode className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Berbagi Profil dengan QR Code</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Bagikan profil Anda dengan mudah menggunakan QR code. Cetak dan tempel di mana saja untuk promosi
                  offline, kartu nama, atau materi pemasaran lainnya untuk meningkatkan jangkauan Anda.
                </p>
                <div className="flex">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                    PROMOSI
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 11: Tanpa Iklan */}
          <div className="mb-24 md:mb-32 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right order-2 md:order-1">
                <div className="inline-flex items-center justify-center p-2 bg-slate-100 rounded-full mb-4">
                  <Shield className="h-6 w-6 text-slate-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Tanpa Iklan</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Nikmati pengalaman tanpa iklan dan gangguan. Dapatkan juga prioritas dukungan dari tim kami kapan saja
                  Anda membutuhkannya, memastikan pengalaman yang lancar dan profesional.
                </p>
                <div className="flex md:justify-end">
                  <span className="inline-block bg-slate-100 text-slate-800 text-sm font-medium px-3 py-1 rounded-full">
                    PENGALAMAN PREMIUM
                  </span>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?height=600&width=800&query=professional ad-free clean interface comparison"
                    alt="Tanpa Iklan"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Pengalaman Bersih</h3>
                      <p>Tanpa iklan, gangguan, atau konten yang tidak relevan</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 12: Akses Selamanya */}
          <div className="mb-16 relative">
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 rounded-full border-4 border-white shadow-lg z-10"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2">
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-transform hover:scale-105 duration-500">
                  <Image
                    src="/placeholder.svg?height=600&width=800&query=professional lifetime access badge with premium features showcase"
                    alt="Akses Selamanya"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Investasi Sekali Seumur Hidup</h3>
                      <p>Akses semua fitur premium sekarang dan di masa depan</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inline-flex items-center justify-center p-2 bg-orange-100 rounded-full mb-4">
                  <Infinity className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Akses Selamanya</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Bayar sekali, akses premium selamanya. Dapatkan semua fitur premium saat ini dan di masa depan tanpa
                  biaya tambahan. Tidak ada langganan bulanan atau biaya tersembunyi.
                </p>
                <div className="flex">
                  <span className="inline-block bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                    NILAI TERBAIK
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tingkatkan Pengalaman SecretMe Anda</h2>
              <p className="text-white/90 mb-6 text-lg">
                Dapatkan akses ke semua fitur premium dengan harga terjangkau. Bayar sekali, akses selamanya.
              </p>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Harga Normal</span>
                  <span className="text-white line-through">Rp 199.000</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Harga Promo</span>
                  <span className="text-white font-bold">Rp 99.000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Anda Hemat</span>
                  <span className="text-white font-bold">Rp 100.000</span>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 hover:text-orange-700 font-bold"
              >
                <Link href="/premium">
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade ke Premium Sekarang
                </Link>
              </Button>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute inset-0">
                <Image
                  src="/placeholder.svg?height=600&width=800&query=professional premium features collage with happy users"
                  alt="Premium Features"
                  width={800}
                  height={600}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
