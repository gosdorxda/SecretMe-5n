"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CreditCard, Crown, Settings, BarChart3, RefreshCw } from "lucide-react"

interface Transaction {
  id: string
  user_id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  reference_id: string
}

interface PremiumManagementProps {
  premiumCount: number
  recentTransactions: Transaction[]
}

export default function PremiumManagement({ premiumCount, recentTransactions }: PremiumManagementProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(false)
  const [premiumSettings, setPremiumSettings] = useState({
    price: process.env.NEXT_PUBLIC_PREMIUM_PRICE || "50000",
    enablePaypal: true,
    enableDuitku: true,
    enableTripay: true,
  })
  const { toast } = useToast()

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Implementasi penyimpanan pengaturan premium
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulasi API call

      toast({
        title: "Berhasil",
        description: "Pengaturan premium berhasil disimpan",
      })
    } catch (error) {
      console.error("Error saving premium settings:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan premium",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Premium</CardTitle>
            <Crown className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pengguna dengan status premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Harga Premium</CardTitle>
            <CreditCard className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {Number.parseInt(premiumSettings.price).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Harga langganan premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gateway Aktif</CardTitle>
            <Settings className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Payment gateway yang aktif</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Pengaturan</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Transaksi</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>5 transaksi premium terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">{transaction.reference_id}</TableCell>
                        <TableCell className="font-mono text-xs">{transaction.user_id}</TableCell>
                        <TableCell>Rp {transaction.amount.toLocaleString()}</TableCell>
                        <TableCell>{transaction.payment_method}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              transaction.status === "success"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : transaction.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(transaction.created_at), "dd MMM yyyy", { locale: id })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground">Belum ada transaksi premium</div>
              )}

              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="/admin-premium">
                    <Crown className="h-4 w-4 mr-2" />
                    Buka Admin Premium Lengkap
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Premium</CardTitle>
              <CardDescription>Konfigurasi fitur dan harga premium</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="premium-price">Harga Premium (Rp)</Label>
                <Input
                  id="premium-price"
                  value={premiumSettings.price}
                  onChange={(e) => setPremiumSettings({ ...premiumSettings, price: e.target.value })}
                  type="number"
                />
                <p className="text-xs text-muted-foreground">Harga langganan premium dalam Rupiah</p>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-medium">Payment Gateway</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="paypal">PayPal</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan pembayaran melalui PayPal</p>
                  </div>
                  <Switch
                    id="paypal"
                    checked={premiumSettings.enablePaypal}
                    onCheckedChange={(checked) => setPremiumSettings({ ...premiumSettings, enablePaypal: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="duitku">Duitku</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan pembayaran melalui Duitku</p>
                  </div>
                  <Switch
                    id="duitku"
                    checked={premiumSettings.enableDuitku}
                    onCheckedChange={(checked) => setPremiumSettings({ ...premiumSettings, enableDuitku: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="tripay">Tripay</Label>
                    <p className="text-xs text-muted-foreground">Aktifkan pembayaran melalui Tripay</p>
                  </div>
                  <Switch
                    id="tripay"
                    checked={premiumSettings.enableTripay}
                    onCheckedChange={(checked) => setPremiumSettings({ ...premiumSettings, enableTripay: checked })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSettings} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Pengaturan"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>Lihat semua transaksi premium di halaman admin premium</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <Crown className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Admin Premium Terpisah</h3>
                <p className="text-muted-foreground mb-4">
                  Untuk melihat riwayat transaksi lengkap dan fitur premium lainnya, silakan buka halaman admin premium.
                </p>
                <Button asChild>
                  <a href="/admin-premium">
                    <Crown className="h-4 w-4 mr-2" />
                    Buka Admin Premium
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
