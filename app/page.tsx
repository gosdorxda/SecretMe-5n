"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import { useState, useEffect } from "react"

export default function Home() {
  const [typedUsername, setTypedUsername] = useState("")
  const [currentNameIndex, setCurrentNameIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(80)

  const usernames = ["budi", "rahayu", "ahmad", "sinta", "dimas"]

  useEffect(() => {
    const currentName = usernames[currentNameIndex]

    // Fungsi untuk menangani efek ketikan
    const handleTyping = () => {
      // Jika sedang menghapus
      if (isDeleting) {
        setTypedUsername((prev) => prev.substring(0, prev.length - 1))
        setTypingSpeed(30)

        // Jika sudah terhapus semua, mulai mengetik nama berikutnya
        if (typedUsername.length === 0) {
          setIsDeleting(false)
          setCurrentNameIndex((currentNameIndex + 1) % usernames.length)
          setTypingSpeed(80)
        }
      }
      // Jika sedang mengetik
      else {
        setTypedUsername(currentName.substring(0, typedUsername.length + 1))

        // Jika sudah selesai mengetik nama, tunggu sebentar lalu mulai menghapus
        if (typedUsername.length === currentName.length) {
          setTimeout(() => setIsDeleting(true), 800)
          return
        }
      }
    }

    // Set interval untuk efek ketikan
    const typingInterval = setTimeout(handleTyping, typingSpeed)

    return () => clearTimeout(typingInterval)
  }, [typedUsername, isDeleting, currentNameIndex, typingSpeed, usernames])

  // Pastikan animasi ketikan langsung berjalan saat halaman dimuat
  useEffect(() => {
    // Trigger animasi ketikan segera
    const initialTypingTimeout = setTimeout(() => {
      setTypedUsername(usernames[0].charAt(0))
    }, 100) // Delay sangat singkat untuk memastikan komponen sudah ter-render

    return () => clearTimeout(initialTypingTimeout)
  }, []) // Empty dependency array ensures this runs only once on mount

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Custom CSS for the single card */}
      <style jsx global>{`
        @keyframes cardAppear {
          0% {
            opacity: 0;
            transform: translateY(20px) rotate(-4deg);
          }
          60% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(-2deg);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: rotate(-2deg);
          }
          25% {
            transform: rotate(-3deg) translateX(-2px);
          }
          50% {
            transform: rotate(-1deg) translateX(2px);
          }
          75% {
            transform: rotate(-3deg) translateX(-1px);
          }
        }
        
        .message-card {
          max-width: 500px;
          margin: 0 auto;
          background-color: white;
          border-radius: 0.5rem;
          border: 2px solid #000;
          box-shadow: 
            4px 4px 0 rgba(0, 0, 0, 0.8),
            0 10px 20px rgba(0, 0, 0, 0.1),
            0 6px 6px rgba(0, 0, 0, 0.1);
          transform: rotate(-2deg);
          position: relative;
          animation: 
            cardAppear 0.8s ease-out forwards,
            shake 0.5s ease-in-out infinite;
          animation-play-state: running;
          animation-iteration-count: 1, infinite;
          animation-delay: 0s, 0s;
          animation-direction: normal, normal;
          animation-fill-mode: forwards, none;
          animation-timing-function: ease-out, ease-in-out;
        }
        
        .message-card:hover {
          animation-play-state: running, paused;
        }
        
        @keyframes avatarAppear {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          70% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: #FFA726;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          color: white;
          border: 2px solid #000;
          animation: avatarAppear 1s ease-out 0.3s backwards;
        }
        
        @keyframes contentFade {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        
        .message-header {
          animation: contentFade 0.8s ease-out 0.4s backwards;
        }
        
        .message-content {
          animation: contentFade 0.8s ease-out 0.6s backwards;
        }
        
        .message-footer {
          animation: contentFade 0.8s ease-out 0.8s backwards;
        }
        
        .reply-button {
          background-color: white;
          border: 2px solid #000;
          border-radius: 0.375rem;
          padding: 6px 16px;
          font-weight: 500;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          transition: all 0.2s ease;
        }
        
        .reply-button:hover {
          transform: translateY(-2px);
          box-shadow: 2px 4px 0 rgba(0, 0, 0, 0.8);
        }
        
        .reply-button:active {
          transform: translateY(0);
          box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
        }
        
        .premium-card {
          transition: all 0.3s ease;
          transform-style: preserve-3d;
          position: relative;
        }
        
        .premium-card:hover {
          transform: translateY(-5px);
        }
        
        .premium-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,165,0,0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: inherit;
          pointer-events: none;
        }
        
        .premium-card:hover::after {
          opacity: 1;
        }
        
        .shadow-neo-sm {
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
        }
      `}</style>
      {/* Hero Section */}
      <section className="py-12 overflow-hidden">
        <div className="w-full max-w-[56rem] mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-1.5">
                <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border border-white">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-amber-400 text-[0.5rem]">
                    A
                  </span>
                </span>
                <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border border-white">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-orange-400 text-[0.5rem]">
                    B
                  </span>
                </span>
                <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border border-white">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-rose-400 text-[0.5rem]">
                    C
                  </span>
                </span>
                <span className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border border-white">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-purple-400 text-[0.5rem]">
                    D
                  </span>
                </span>
              </div>
              <span className="text-xs">30.000+ pengguna sudah bergabung!</span>
            </div>

            {/* Text content above the card */}
            <div className="w-full space-y-4 text-center mb-6">
              <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                Terima Pesan <span className="text-blue-500">Anonim</span> dari Siapapun
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Platform untuk menerima pesan dan umpan balik secara anonim. Dapatkan kejujuran dari teman dan rekan
                kerja Anda.
              </p>

              {/* Username Promo Form - Moved here to replace the button */}
              <div className="w-full max-w-sm mx-auto mt-12 mb-8 px-4 sm:px-0">
                <div className="bg-white rounded-[var(--border-radius)] border-2 border-black">
                  <div className="flex items-center justify-between p-1 pl-4">
                    <div className="text-black font-sm text-lg md:text-xl whitespace-nowrap overflow-hidden text-ellipsis">
                      secretme.site/
                      <span className="text-gray-600 opacity-70 font-sm">{typedUsername}</span>
                      <span className="animate-pulse">|</span>
                    </div>
                    <Link
                      href="/register"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-2 rounded-[var(--border-radius)] border-2 border-black"
                    >
                      Buat!
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Message Card */}
            <div className="w-full px-4 sm:px-0 py-8 relative">
              <div className="message-card p-4">
                <div className="flex items-start gap-3">
                  <div className="avatar">A</div>
                  <div className="flex-1 message-header">
                    <div className="flex items-center">
                      <div className="text-sm font-medium">Pesan Anonim</div>
                      <div className="mx-1">•</div>
                      <div className="text-sm text-gray-500">Baru saja</div>
                    </div>
                    <div className="text-sm">
                      Untuk: <span className="font-medium">@budi</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-base leading-relaxed message-content">
                  Presentasimu minggu lalu sangat menginspirasi! Kamu punya cara yang bagus untuk menjelaskan konsep
                  yang kompleks dengan sederhana.
                </div>

                <div className="mt-4 flex justify-end message-footer">
                  <button className="reply-button">Balas</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 md:py-12 bg-[var(--bg)] border-t-[3px] border-black">
        <div className="w-full max-w-[56rem] mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">Ulasan Pengguna</h2>
          <p className="text-gray-600 mb-10">Lihat apa kata pengguna tentang pengalaman mereka menggunakan Secretme</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white p-4 rounded-lg border-2 border-black testimonial-card">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold mr-3 border-2 border-black">
                  DP
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Dian Pratama</h3>
                  <p className="text-gray-500 text-sm">Influencer</p>
                </div>
              </div>
              <p className="text-left mb-4 text-gray-700">
                "Secretme membantu saya mendapatkan feedback jujur dari followers. Fitur premium worth it dengan
                notifikasi yang memudahkan respon cepat!"
              </p>
              <div className="flex text-yellow-400 text-xl">
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-4 rounded-lg border-2 border-black testimonial-card">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3 border-2 border-black">
                  RS
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Rini Sulistiani</h3>
                  <p className="text-gray-500 text-sm">Manajer HR</p>
                </div>
              </div>
              <p className="text-left mb-4 text-gray-700">
                "Kami gunakan Secretme untuk feedback anonim karyawan. Hasilnya luar biasa! Banyak masalah tersembunyi
                akhirnya terungkap."
              </p>
              <div className="flex text-yellow-400 text-xl">
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-4 rounded-lg border-2 border-black testimonial-card">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold mr-3 border-2 border-black">
                  FA
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Fajar Aditya</h3>
                  <p className="text-gray-500 text-sm">Content Creator</p>
                </div>
              </div>
              <p className="text-left mb-4 text-gray-700">
                "Game changer untuk konten saya! Dapat ide baru dari pesan anonim dan fitur link sosmed sangat membantu
                cross-promotion."
              </p>
              <div className="flex text-yellow-400 text-xl">
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-yellow-400 h-5 w-5" />
                <Star className="fill-none stroke-gray-300 h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-8 bg-[var(--main)] border-t-[3px] border-black">
        <div className="w-full max-w-[56rem] mx-auto px-4">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 md:gap-4">
            <div className="text-center md:text-left">
              <div className="text-3xl md:text-4xl font-bold">30,000+</div>
              <div className="text-sm font-medium">Pengguna Terdaftar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">1.2 Juta+</div>
              <div className="text-sm font-medium">Pesan Terkirim</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">98%</div>
              <div className="text-sm font-medium">Kepuasan Pengguna</div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl md:text-4xl font-bold">5,280+</div>
              <div className="text-sm font-medium">Pengguna Premium</div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Section - Modified with borders */}
      <section className="py-16 bg-[var(--bg)] border-t-[3px] border-black">
        <div className="w-full max-w-[56rem] mx-auto px-4">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center justify-center rounded-[var(--border-radius)] border-2 border-[var(--border)] font-semibold bg-[var(--main)] text-[var(--mtext)] text-sm px-4 py-1">
                  PENAWARAN SPESIAL
                </div>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Sekali Bayar, <span className="text-blue-500">Akses Selamanya</span>!
                </h2>
                <p className="text-lg">
                  Dapatkan semua fitur premium Secretme dengan pembayaran satu kali. Tanpa biaya berlangganan bulanan!
                </p>
                <div className="bg-white p-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold">Rp 16.500</span>
                      <span className="text-lg line-through text-gray-500 ml-2">Rp 49.000</span>
                    </div>
                    <div className="inline-flex items-center justify-center rounded-[var(--border-radius)] border-2 border-[var(--border)] px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white">
                      Hemat 38%
                    </div>
                  </div>
                  <p className="text-sm mt-1">Pembayaran sekali, akses seumur hidup ke semua fitur premium</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--main)] border border-[var(--border)]">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="font-medium">Link dan username kustom selamanya</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--main)] border border-[var(--border)]">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="font-medium">Notifikasi WhatsApp &amp; Email tanpa batas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--main)] border border-[var(--border)]">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="font-medium">Statistik lengkap &amp; analitik pesan selamanya</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--main)] border border-[var(--border)]">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="font-medium">Tanpa iklan &amp; prioritas dukungan seumur hidup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--main)] border border-[var(--border)]">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="font-medium">Semua update fitur premium di masa depan</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    ></path>
                  </svg>
                  <span className="text-sm">Garansi 30 hari uang kembali. Tanpa risiko!</span>
                </div>
              </div>
              <div className="flex-shrink-0 w-full md:w-1/3 relative">
                <div className="relative transform transition-all hover:scale-105">
                  <div className="rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] bg-white rotate-3">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="inline-flex items-center justify-center rounded-[var(--border-radius)] border-2 border-[var(--border)] px-2.5 py-0.5 text-xs font-semibold bg-blue-500 text-white">
                          Premium Lifetime
                        </div>
                        <span className="text-sm font-bold">@username</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                        <div className="h-2 bg-gray-200 rounded-full w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded-full w-5/6"></div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex -space-x-1">
                          <div className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border border-white">
                            <div className="flex h-full w-full items-center justify-center bg-blue-400 text-[0.5rem]">
                              A
                            </div>
                          </div>
                          <div className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border border-white">
                            <div className="flex h-full w-full items-center justify-center bg-green-400 text-[0.5rem]">
                              B
                            </div>
                          </div>
                          <div className="relative flex shrink-0 overflow-hidden rounded-full h-6 w-6 border border-white">
                            <div className="flex h-full w-full items-center justify-center bg-purple-400 text-[0.5rem]">
                              C
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-medium">120+ pesan</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] bg-white absolute top-6 -right-4 -rotate-6">
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium">Lifetime</span>
                        </div>
                        <span className="text-xs font-bold">Statistik</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-center">
                          <div className="text-sm font-bold">152</div>
                          <div className="text-xs">Pesan</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold">89%</div>
                          <div className="text-xs">Positif</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold">320</div>
                          <div className="text-xs">Views</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
