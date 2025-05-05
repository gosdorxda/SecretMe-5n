"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getAllPaymentMethodPrices,
  updatePaymentMethodPrice,
  type PaymentMethodPrice,
} from "@/lib/payment/price-service"
import { Pencil, Save, X, RefreshCw } from "lucide-react"

export default function PaymentMethodPrices() {
  const [prices, setPrices] = useState<PaymentMethodPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const { toast } = useToast()

  // Load all payment method prices
  const loadPrices = async () => {
    try {
      setLoading(true)
      const data = await getAllPaymentMethodPrices()
      setPrices(data)
      setLoading(false)
    } catch (error) {
      console.error("Error loading payment method prices:", error)
      setLoading(false)
      toast({
        title: "Error",
        description: "Gagal memuat data harga metode pembayaran",
        variant: "destructive",
      })
    }
  }

  // Load prices on component mount
  useEffect(() => {
    loadPrices()
  }, [])

  // Start editing a price
  const handleEdit = (price: PaymentMethodPrice) => {
    setEditingId(price.id)
    setEditValue(price.price)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue(0)
  }

  // Save edited price
  const handleSave = async (price: PaymentMethodPrice) => {
    try {
      const success = await updatePaymentMethodPrice(price.payment_gateway, price.payment_method, editValue)

      if (success) {
        toast({
          title: "Berhasil",
          description: "Harga metode pembayaran berhasil diperbarui",
        })
        setEditingId(null)
        loadPrices() // Reload prices
      } else {
        toast({
          title: "Error",
          description: "Gagal memperbarui harga metode pembayaran",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving payment method price:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui harga metode pembayaran",
        variant: "destructive",
      })
    }
  }

  // Get payment method name
  const getMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      QR: "QRIS by ShopeePay",
      BC: "BCA Virtual Account",
      OV: "OVO",
      DA: "DANA",
    }
    return methodNames[method] || method
  }

  // Get gateway name
  const getGatewayName = (gateway: string) => {
    const gatewayNames: Record<string, string> = {
      duitku: "Duitku",
      tripay: "TriPay",
    }
    return gatewayNames[gateway] || gateway
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Harga Berdasarkan Metode Pembayaran</CardTitle>
          <Button variant="outline" size="sm" onClick={loadPrices} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? "Memuat..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Atur harga berbeda untuk setiap metode pembayaran. Harga ini akan menggantikan harga default.
          </div>

          {prices.length === 0 && !loading ? (
            <div className="text-center py-8 border-2 border-dashed rounded-md">
              <p className="text-muted-foreground">Belum ada data harga metode pembayaran</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead className="text-right">Harga (Rp)</TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell>{getGatewayName(price.payment_gateway)}</TableCell>
                      <TableCell>{getMethodName(price.payment_method)}</TableCell>
                      <TableCell className="text-right">
                        {editingId === price.id ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-32 ml-auto"
                          />
                        ) : (
                          <span className="font-medium">{price.price.toLocaleString("id-ID")}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === price.id ? (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleSave(price)} className="h-8 w-8">
                              <Save className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8">
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(price)} className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
