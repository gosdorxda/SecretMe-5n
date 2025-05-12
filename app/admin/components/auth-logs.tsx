"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Trash2 } from "lucide-react"

type AuthLog = {
  timestamp: number
  endpoint: string
  method: string
  source: string
  success: boolean
  duration: number
  cached: boolean
  userId?: string
  error?: string
  details?: any
}

type AuthStats = {
  last5Minutes: {
    total: number
    success: number
    failed: number
    cached: number
    avgDuration: number
  }
  lastHour: {
    total: number
    success: number
    failed: number
    cached: number
    avgDuration: number
  }
  last24Hours: {
    total: number
    success: number
    failed: number
    cached: number
    avgDuration: number
  }
  byEndpoint: Record<string, { count: number; success: number; failed: number }>
  bySource: Record<string, { count: number; success: number; failed: number }>
}

export default function AuthLogs() {
  const [logs, setLogs] = useState<AuthLog[]>([])
  const [stats, setStats] = useState<AuthStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("logs")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/auth-logs?stats=true")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setStats(data.stats)
      } else {
        console.error("Failed to fetch auth logs")
      }
    } catch (error) {
      console.error("Error fetching auth logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all auth logs?")) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/auth-logs", {
        method: "DELETE",
      })
      if (response.ok) {
        setLogs([])
        fetchLogs()
      } else {
        console.error("Failed to clear auth logs")
      }
    } catch (error) {
      console.error("Error clearing auth logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()

    // Auto-refresh setiap 30 detik
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (duration: number) => {
    return `${Math.round(duration)}ms`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Auth Logs</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={clearLogs} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Monitor authentication requests to Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.endpoint}</TableCell>
                        <TableCell>{log.method}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.source === "client" ? "default" : log.source === "server" ? "secondary" : "outline"
                            }
                          >
                            {log.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="success" className="bg-green-500">
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                          {log.cached && (
                            <Badge variant="outline" className="ml-1">
                              Cached
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDuration(log.duration)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.userId ? log.userId.substring(0, 8) + "..." : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{log.error || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Last 5 Minutes" stats={stats.last5Minutes} />
                <StatCard title="Last Hour" stats={stats.lastHour} />
                <StatCard title="Last 24 Hours" stats={stats.last24Hours} />
              </div>
            ) : (
              <div className="text-center py-4">No statistics available</div>
            )}
          </TabsContent>

          <TabsContent value="endpoints">
            {stats ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.byEndpoint).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No endpoint statistics available
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(stats.byEndpoint)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .map(([endpoint, data]) => (
                          <TableRow key={endpoint}>
                            <TableCell>{endpoint}</TableCell>
                            <TableCell>{data.count}</TableCell>
                            <TableCell>{data.success}</TableCell>
                            <TableCell>{data.failed}</TableCell>
                            <TableCell>
                              {data.count > 0 ? `${Math.round((data.success / data.count) * 100)}%` : "0%"}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">No endpoint statistics available</div>
            )}
          </TabsContent>

          <TabsContent value="sources">
            {stats ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(stats.bySource).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No source statistics available
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(stats.bySource)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .map(([source, data]) => (
                          <TableRow key={source}>
                            <TableCell>
                              <Badge
                                variant={
                                  source === "client" ? "default" : source === "server" ? "secondary" : "outline"
                                }
                              >
                                {source}
                              </Badge>
                            </TableCell>
                            <TableCell>{data.count}</TableCell>
                            <TableCell>{data.success}</TableCell>
                            <TableCell>{data.failed}</TableCell>
                            <TableCell>
                              {data.count > 0 ? `${Math.round((data.success / data.count) * 100)}%` : "0%"}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">No source statistics available</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function StatCard({ title, stats }: { title: string; stats: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Requests:</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Success:</span>
            <span className="font-medium text-green-500">{stats.success}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Failed:</span>
            <span className="font-medium text-red-500">{stats.failed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cached:</span>
            <span className="font-medium">{stats.cached}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Duration:</span>
            <span className="font-medium">{stats.avgDuration}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Success Rate:</span>
            <span className="font-medium">
              {stats.total > 0 ? `${Math.round((stats.success / stats.total) * 100)}%` : "0%"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
