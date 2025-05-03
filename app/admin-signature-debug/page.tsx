"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignatureDebugPage() {
  const [payload, setPayload] = useState("")
  const [signature, setSignature] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleTest = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      // Parse payload if it's a string
      let parsedPayload
      try {
        parsedPayload = JSON.parse(payload)
      } catch (e) {
        throw new Error("Payload harus dalam format JSON yang valid")
      }

      const response = await fetch("/api/payment/debug-signature-specific", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: parsedPayload,
          signature,
          privateKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Terjadi kesalahan saat memproses request")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Debug Signature TriPay</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Data</CardTitle>
            <CardDescription>
              Masukkan payload, signature, dan private key untuk menguji format signature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payload">Payload (JSON)</Label>
              <Textarea
                id="payload"
                placeholder='{"reference":"T123","merchant_ref":"ORDER-123","status":"PAID",...}'
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="min-h-[200px] font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Signature</Label>
              <Input
                id="signature"
                placeholder="fdefca0dce9d0150c5e41f9dc70e80fedcb9b4f9501593413eb301810f82e032"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateKey">Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Private Key TriPay Anda"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleTest} disabled={loading}>
              {loading ? "Memproses..." : "Uji Signature"}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Hasil Pengujian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md bg-gray-100 dark:bg-gray-800">
                <p className="font-semibold">
                  {result.matchFound ? (
                    <span className="text-green-500">✓ Format signature ditemukan!</span>
                  ) : (
                    <span className="text-red-500">✗ Tidak ada format yang cocok</span>
                  )}
                </p>

                {result.matchFound && (
                  <p className="mt-2">
                    Format yang cocok: <span className="font-mono font-bold">{result.matchedFormat}</span>
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Detail Hasil</h3>
                <div className="space-y-4">
                  {result.results &&
                    Object.entries(result.results).map(([format, details]: [string, any]) => (
                      <div
                        key={format}
                        className={`p-3 rounded-md ${
                          details.matches
                            ? "bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <p className="font-mono text-sm mb-1">
                          Format: <span className="font-bold">{format}</span>
                          {details.matches && " ✓"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Data: {details.data} (length: {details.dataLength})
                        </p>
                        <p className="text-xs font-mono mt-1 break-all">Signature: {details.calculatedSignature}</p>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
