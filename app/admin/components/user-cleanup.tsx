"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle } from "lucide-react"

export function UserCleanup() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  async function handleCleanup() {
    if (!email) {
      toast({
        title: "Email diperlukan",
        description: "Masukkan email pengguna yang ingin dibersihkan",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/cleanup-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan saat membersihkan data pengguna")
      }

      setResult({
        success: true,
        message: data.message || `Pengguna dengan email ${email} berhasil dibersihkan`,
      })

      toast({
        title: "Berhasil",
        description: data.message || `Pengguna dengan email ${email} berhasil dibersihkan`,
      })
    } catch (error: any) {
      console.error("Error cleaning up user:", error)
      setResult({
        success: false,
        message: error.message || "Terjadi kesalahan saat membersihkan data pengguna",
      })

      toast({
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat membersihkan data pengguna",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pembersihan Data Pengguna</CardTitle>
        <CardDescription>
          Gunakan fitur ini untuk membersihkan data pengguna yang tidak konsisten di database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Pengguna
            </label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-gray-500">Masukkan email pengguna yang ingin dibersihkan dari database</p>
          </div>

          {result && (
            <div
              className={`p-3 rounded-md flex items-start gap-2 ${
                result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm">{result.message}</div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCleanup} disabled={isLoading || !email}>
          {isLoading ? "Memproses..." : "Bersihkan Data Pengguna"}
        </Button>
      </CardFooter>
    </Card>
  )
}
