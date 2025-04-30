import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Shield, Bell, UserPlus, Zap, Lock } from "lucide-react"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-mtext">
            Pesan Anonim <span className="text-main">Cara Baru</span>
          </h1>
          <p className="text-xl md:text-2xl text-mtext/80 max-w-3xl mx-auto">
            SecretMe memberikan Anda platform untuk menerima pesan anonim dengan cara yang aman, menyenangkan, dan
            terkontrol.
          </p>
          <div className="pt-6">
            <Button
              asChild
              size="lg"
              className="rounded-[var(--border-radius)] bg-main hover:bg-main/90 text-mtext border-2 border-[var(--border)] shadow-neo"
            >
              <Link href="/register">Mulai Sekarang</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-8 py-16">
          <div className="md:w-1/2 space-y-4">
            <div className="inline-block p-3 bg-bw rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo-sm">
              <MessageSquare className="h-6 w-6 text-main" />
            </div>
            <h2 className="text-3xl font-bold text-mtext">Buat Profil Unik Anda</h2>
            <p className="text-lg text-mtext/80">
              Daftarkan diri Anda dan dapatkan link profil unik yang dapat Anda bagikan di mana saja. Pengunjung dapat
              mengirimkan pesan anonim melalui link tersebut tanpa perlu mendaftar.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Profil yang dapat disesuaikan</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Link yang mudah dibagikan</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Tanpa perlu pendaftaran untuk pengirim</span>
              </li>
            </ul>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="rounded-[var(--border-radius)] overflow-hidden border-2 border-[var(--border)] shadow-neo bg-bw">
              <Image
                src="/website-profile-creation.png"
                alt="Buat Profil"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 py-16">
          <div className="md:w-1/2 space-y-4">
            <div className="inline-block p-3 bg-bw rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo-sm">
              <Shield className="h-6 w-6 text-main" />
            </div>
            <h2 className="text-3xl font-bold text-mtext">Privasi & Keamanan Terjamin</h2>
            <p className="text-lg text-mtext/80">
              Kami mengutamakan privasi dan keamanan Anda. Semua pesan dienkripsi dan Anda memiliki kendali penuh atas
              pesan yang ingin Anda tampilkan atau sembunyikan.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Enkripsi end-to-end</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Filter pesan yang tidak diinginkan</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Kontrol penuh atas pesan</span>
              </li>
            </ul>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="rounded-[var(--border-radius)] overflow-hidden border-2 border-[var(--border)] shadow-neo bg-bw">
              <Image
                src="/secure-messaging-privacy-ui.png"
                alt="Privasi & Keamanan"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col md:flex-row items-center gap-8 py-16">
          <div className="md:w-1/2 space-y-4">
            <div className="inline-block p-3 bg-bw rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo-sm">
              <Bell className="h-6 w-6 text-main" />
            </div>
            <h2 className="text-3xl font-bold text-mtext">Notifikasi Real-time</h2>
            <p className="text-lg text-mtext/80">
              Dapatkan notifikasi instan saat ada pesan baru melalui WhatsApp, Telegram, atau email. Tidak perlu terus
              memeriksa profil Anda untuk melihat pesan baru.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Notifikasi WhatsApp</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Notifikasi Telegram</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Notifikasi Email</span>
              </li>
            </ul>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="rounded-[var(--border-radius)] overflow-hidden border-2 border-[var(--border)] shadow-neo bg-bw">
              <Image
                src="/mobile-notifications.png"
                alt="Notifikasi Real-time"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 py-16">
          <div className="md:w-1/2 space-y-4">
            <div className="inline-block p-3 bg-bw rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo-sm">
              <UserPlus className="h-6 w-6 text-main" />
            </div>
            <h2 className="text-3xl font-bold text-mtext">Balas Pesan Publik</h2>
            <p className="text-lg text-mtext/80">
              Balas pesan anonim secara publik dan buat percakapan menarik yang dapat dilihat oleh semua orang. Fitur
              ini memungkinkan interaksi yang lebih dinamis dengan pengikut Anda.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Balas pesan secara publik</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Percakapan yang dapat dilihat semua orang</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Tingkatkan interaksi dengan pengikut</span>
              </li>
            </ul>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="rounded-[var(--border-radius)] overflow-hidden border-2 border-[var(--border)] shadow-neo bg-bw">
              <Image
                src="/anonymous-conversation-thread.png"
                alt="Balas Pesan Publik"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Feature 5 */}
        <div className="flex flex-col md:flex-row items-center gap-8 py-16">
          <div className="md:w-1/2 space-y-4">
            <div className="inline-block p-3 bg-bw rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo-sm">
              <Zap className="h-6 w-6 text-main" />
            </div>
            <h2 className="text-3xl font-bold text-mtext">Bagikan ke Media Sosial</h2>
            <p className="text-lg text-mtext/80">
              Bagikan pesan favorit Anda ke media sosial dengan template yang menarik. Tingkatkan engagement dan tarik
              lebih banyak pengikut ke profil SecretMe Anda.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Template yang dapat disesuaikan</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Berbagi ke Instagram, Twitter, dan lainnya</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Tingkatkan engagement sosial media</span>
              </li>
            </ul>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="rounded-[var(--border-radius)] overflow-hidden border-2 border-[var(--border)] shadow-neo bg-bw">
              <Image
                src="/anonymous-message-templates.png"
                alt="Bagikan ke Media Sosial"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Feature 6 - Premium */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 py-16">
          <div className="md:w-1/2 space-y-4">
            <div className="inline-block p-3 bg-bw rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo-sm">
              <Lock className="h-6 w-6 text-main" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold text-mtext">Fitur Premium</h2>
              <span className="px-3 py-1 text-xs font-medium bg-main text-mtext rounded-[var(--border-radius)] border border-[var(--border)] shadow-neo-sm">
                PRO
              </span>
            </div>
            <p className="text-lg text-mtext/80">
              Tingkatkan pengalaman Anda dengan fitur premium. Dapatkan statistik lengkap, tema khusus, dan fitur
              eksklusif lainnya untuk pengalaman yang lebih baik.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Statistik pengunjung lengkap</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Tema dan template eksklusif</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <svg className="h-4 w-4 text-mtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-mtext">Prioritas dukungan pelanggan</span>
              </li>
            </ul>
            <div className="pt-4">
              <Button
                asChild
                className="rounded-[var(--border-radius)] bg-main hover:bg-main/90 text-mtext border-2 border-[var(--border)] shadow-neo"
              >
                <Link href="/premium">Upgrade ke Premium</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="rounded-[var(--border-radius)] overflow-hidden border-2 border-[var(--border)] shadow-neo bg-bw">
              <Image
                src="/premium-analytics-dashboard.png"
                alt="Fitur Premium"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-bw rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-mtext">Siap untuk memulai?</h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-mtext/80">
              Buat profil SecretMe Anda sekarang dan mulai terima pesan anonim dari teman, penggemar, atau siapa saja!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-[var(--border-radius)] bg-main hover:bg-main/90 text-mtext border-2 border-[var(--border)] shadow-neo"
              >
                <Link href="/register">Daftar Gratis</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-[var(--border-radius)] border-2 border-[var(--border)] bg-transparent hover:bg-gray-100 shadow-neo"
              >
                <Link href="/login">Masuk</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-mtext">Apa Kata Pengguna Kami</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Andi Pratama",
              role: "Content Creator",
              quote:
                "SecretMe membantu saya mendapatkan masukan jujur dari pengikut saya. Fitur notifikasi WhatsApp sangat membantu!",
              avatar: "/professional-male-portrait.png",
            },
            {
              name: "Siti Rahma",
              role: "Influencer",
              quote:
                "Saya suka bagaimana saya bisa membalas pesan secara publik. Ini membuat interaksi dengan pengikut saya lebih menarik.",
              avatar: "/professional-female-portrait.png",
            },
            {
              name: "Budi Santoso",
              role: "Musisi",
              quote:
                "Fitur premium benar-benar worth it! Statistik dan tema khusus membuat profil saya lebih profesional.",
              avatar: "/musician-portrait.png",
            },
          ].map((testimonial, i) => (
            <div
              key={i}
              className="bg-bw p-6 rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-[var(--border-radius)] bg-main flex items-center justify-center border border-[var(--border)] shadow-neo-sm">
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    width={50}
                    height={50}
                    className="rounded-[var(--border-radius)]"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-mtext">{testimonial.name}</h3>
                  <p className="text-mtext/60 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-mtext/80 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-mtext">Pertanyaan Umum</h2>
        <div className="space-y-6">
          {[
            {
              q: "Apakah SecretMe benar-benar anonim?",
              a: "Ya, semua pesan yang dikirim melalui SecretMe benar-benar anonim. Kami tidak menyimpan informasi pengirim yang dapat diidentifikasi.",
            },
            {
              q: "Bagaimana cara mendapatkan notifikasi pesan baru?",
              a: "Anda dapat mengatur notifikasi melalui WhatsApp, Telegram, atau email di halaman pengaturan notifikasi setelah login.",
            },
            {
              q: "Apakah saya bisa memblokir pesan yang tidak diinginkan?",
              a: "Ya, Anda memiliki kontrol penuh untuk menghapus pesan yang tidak diinginkan dan dapat mengaktifkan filter kata-kata tertentu.",
            },
            {
              q: "Berapa biaya untuk upgrade ke Premium?",
              a: "Paket Premium tersedia dengan harga terjangkau. Kunjungi halaman Premium untuk informasi harga terbaru dan fitur yang ditawarkan.",
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="bg-bw p-6 rounded-[var(--border-radius)] border-2 border-[var(--border)] shadow-neo"
            >
              <h3 className="font-semibold text-lg mb-2 text-mtext">{faq.q}</h3>
              <p className="text-mtext/80">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
