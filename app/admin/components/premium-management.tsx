"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Crown } from "lucide-react"

export default function PremiumManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Premium</CardTitle>
        <CardDescription>Kelola fitur dan transaksi premium</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Halaman Admin Premium</h3>
            <p className="text-sm text-amber-700 mt-1">
              Untuk pengaturan lebih lengkap dan melihat riwayat transaksi, silakan kunjungi halaman admin premium.
            </p>
            <Button asChild className="mt-3 bg-amber-500 hover:bg-amber-600">
              <a href="/admin-premium">
                <Crown className="h-4 w-4 mr-2" />
                Buka Admin Premium
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
