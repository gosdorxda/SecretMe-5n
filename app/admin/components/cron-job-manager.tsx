"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export function CronJobManager() {
  // Inisialisasi dengan string kosong, tanpa referensi ke variabel lingkungan
  const [secret, setSecret] = useState("")
  const [batchSize, setBatchSize] = useState("10")
  const [channels, setChannels] = useState("telegram,whatsapp,email")
  const [cleanup, setCleanup] = useState(false)
  const [daysToKeep, setDaysToKeep] = useState("7")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [configResult, setConfigResult] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkConfig = async () => {
    setConfigLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/cron/check-config?secret=${encodeURIComponent(secret)}`)
      const data = await response.json()
      setConfigResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setConfigLoading(false)
    }
  }

  const runCronJob = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `/api/cron/process-notification-queue?secret=${encodeURIComponent(secret)}&batchSize=${batchSize}&channels=${channels}`

      if (cleanup) {
        url += `&cleanup=true&daysToKeep=${daysToKeep}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`)
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cron Job Manager</CardTitle>
        <CardDescription>Kelola dan uji cron job untuk pemrosesan antrian notifikasi</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="run">
          <TabsList className="mb-4">
            <TabsTrigger value="run">Run Cron Job</TabsTrigger>
            <TabsTrigger value="config">Check Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="run">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret">Cron Secret</Label>
                <Input
                  id="secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Masukkan cron secret"
                  type="password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    type="number"
                    min="1"
                    max="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channels">Channels (comma separated)</Label>
                  <Input
                    id="channels"
                    value={channels}
                    onChange={(e) => setChannels(e.target.value)}
                    placeholder="telegram,whatsapp,email"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="cleanup"
                  type="checkbox"
                  checked={cleanup}
                  onChange={(e) => setCleanup(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="cleanup">Cleanup old notifications</Label>
              </div>

              {cleanup && (
                <div className="space-y-2">
                  <Label htmlFor="daysToKeep">Days to keep</Label>
                  <Input
                    id="daysToKeep"
                    value={daysToKeep}
                    onChange={(e) => setDaysToKeep(e.target.value)}
                    type="number"
                    min="1"
                    max="90"
                  />
                </div>
              )}

              <Button onClick={runCronJob} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Run Cron Job Now"
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4 text-red-700">
                <div className="flex">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4 rounded-md border p-4">
                <h3 className="mb-2 font-medium">Result:</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Processed:</span>
                    <span>{result.processed}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Success:</span>
                    <span className="text-green-600">{result.success}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Failed:</span>
                    <span className="text-red-600">{result.failed}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Processing Time:</span>
                    <span>{result.processingTime}</span>
                  </div>

                  {result.cleanup && (
                    <div className="flex items-center justify-between">
                      <span>Cleaned up:</span>
                      <span>{result.cleanup.count} items</span>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <details>
                  <summary className="cursor-pointer font-medium">View Full Response</summary>
                  <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-gray-100 p-2 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </TabsContent>

          <TabsContent value="config">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="configSecret">Cron Secret</Label>
                <Input
                  id="configSecret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Masukkan cron secret untuk verifikasi"
                  type="password"
                />
              </div>

              <Button onClick={checkConfig} disabled={configLoading} className="w-full">
                {configLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check Configuration"
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-4 text-red-700">
                <div className="flex">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {configResult && (
              <div className="mt-4 rounded-md border p-4">
                <h3 className="mb-2 font-medium">Configuration Status:</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>CRON_SECRET configured:</span>
                    {configResult.config?.cronSecretConfigured ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" /> No
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Provided secret matches:</span>
                    {configResult.config?.providedSecretMatches ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" /> No
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-gray-500">
          Pastikan CRON_SECRET telah dikonfigurasi dengan benar di environment variables.
        </p>
      </CardFooter>
    </Card>
  )
}
