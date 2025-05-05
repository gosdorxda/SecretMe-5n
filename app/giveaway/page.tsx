import Link from "next/link"
import { Gift, Share2, UserPlus, Award, ExternalLink, Check, Lock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Giveaway - SecretMe",
  description: "Ikuti giveaway SecretMe dan menangkan total hadiah 500rb untuk 10 orang pemenang beruntung!",
}

export default function GiveawayPage() {
  // Dummy data untuk pemenang (akan diblur)
  const winners = Array(10)
    .fill(null)
    .map((_, i) => ({
      position: i + 1,
      username: `user${i + 1}`,
      prize: i === 0 ? "Rp 100.000" : "Rp 50.000",
    }))

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-heading-1 mb-4 flex items-center justify-center gap-2">
            <Gift className="h-10 w-10 text-[var(--main)]" />
            <span>Giveaway SecretMe</span>
          </h1>
          <p className="text-body-large mb-6">
            Total hadiah <span className="font-bold text-[var(--main)]">Rp 500.000</span> untuk 10 orang pemenang
            beruntung!
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Prize Info */}
          <Card className="neo-card overflow-hidden">
            <div className="bg-[var(--main)] p-4 text-center">
              <h2 className="text-heading-3 text-black font-bold">Hadiah Giveaway</h2>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-[var(--main)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Juara 1</h3>
                    <p>Rp 100.000 tunai</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-[var(--main)] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold">Juara 2-10</h3>
                    <p>Rp 50.000 tunai (9 orang)</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-[var(--border-radius)]">
                  <p className="text-sm">
                    <span className="font-bold">Periode Giveaway:</span> 1 - 30 Juni 2025
                  </p>
                  <p className="text-sm mt-2">
                    <span className="font-bold">Pengumuman Pemenang:</span> 5 Juli 2025
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - How to Join */}
          <Card className="neo-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-heading-3">Cara Mengikuti</CardTitle>
              <CardDescription>Ikuti 3 langkah mudah ini untuk kesempatan menang!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[var(--main)] flex items-center justify-center text-black font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Daftar Akun di SecretMe
                    </h3>
                    <p className="text-sm mt-1">Buat akun gratis atau gunakan akun yang sudah ada</p>
                    <Link href="/register">
                      <Button className="mt-2 neo-btn" size="sm">
                        Daftar Sekarang
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[var(--main)] flex items-center justify-center text-black font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Bagikan Link Profil ke X
                    </h3>
                    <p className="text-sm mt-1">
                      Bagikan link profil SecretMe Anda ke platform X (Twitter) dengan hashtag #SecretMeGiveaway
                    </p>
                    <Button className="mt-2 neo-btn-outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Bagikan ke X
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-[var(--main)] flex items-center justify-center text-black font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      Sematkan di Profil (Opsional)
                    </h3>
                    <p className="text-sm mt-1">
                      Untuk kesempatan menang lebih besar, sematkan link SecretMe di bio profil media sosial Anda
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animated Banner */}
        <div className="relative overflow-hidden rounded-[var(--border-radius)] mb-12 border-2 border-black">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 p-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/placeholder.svg?key=u535e')] opacity-20"></div>
            <div className="relative z-10">
              <h2 className="text-heading-2 text-black font-bold mb-4">Kesempatan Terbatas!</h2>
              <p className="text-black text-lg mb-4">Jangan lewatkan kesempatan untuk memenangkan hadiah tunai!</p>
              <Link href="/register">
                <Button className="neo-btn text-lg px-6 py-3">Daftar & Ikuti Sekarang</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Winners Table */}
        <Card className="neo-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[var(--main)]" />
              Daftar Pemenang
            </CardTitle>
            <CardDescription>Pemenang akan diumumkan pada 5 Juli 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden">
              {/* Blur overlay */}
              <div className="absolute inset-0 backdrop-blur-md z-10 flex items-center justify-center">
                <div className="text-center p-6 bg-white/80 dark:bg-black/80 rounded-lg shadow-lg">
                  <Lock className="h-10 w-10 mx-auto mb-2 text-[var(--main)]" />
                  <h3 className="text-lg font-bold mb-1">Pemenang Belum Diumumkan</h3>
                  <p>Pengumuman pemenang akan dilakukan pada 5 Juli 2025</p>
                </div>
              </div>

              {/* Table that will be blurred */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Posisi</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="text-right">Hadiah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winners.map((winner) => (
                      <TableRow key={winner.position}>
                        <TableCell className="font-medium">#{winner.position}</TableCell>
                        <TableCell>@{winner.username}</TableCell>
                        <TableCell className="text-right">{winner.prize}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="neo-card">
          <CardHeader>
            <CardTitle>Pertanyaan Umum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold">Bagaimana cara menentukan pemenang?</h3>
              <p className="text-sm">Pemenang akan dipilih secara acak dari semua peserta yang memenuhi syarat.</p>
            </div>
            <div>
              <h3 className="font-bold">Kapan hadiah akan dikirimkan?</h3>
              <p className="text-sm">Hadiah akan ditransfer dalam waktu 7 hari kerja setelah pengumuman pemenang.</p>
            </div>
            <div>
              <h3 className="font-bold">Apakah giveaway ini terbuka untuk semua negara?</h3>
              <p className="text-sm">Ya, giveaway ini terbuka untuk semua pengguna SecretMe di seluruh dunia.</p>
            </div>
            <div>
              <h3 className="font-bold">Bagaimana jika saya sudah memiliki akun SecretMe?</h3>
              <p className="text-sm">Anda tetap bisa mengikuti giveaway ini dengan akun yang sudah ada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Trophy icon component
function Trophy(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
