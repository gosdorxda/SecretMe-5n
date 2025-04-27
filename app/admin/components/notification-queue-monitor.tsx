"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { processQueue, cleanupQueue, getQueueStats } from "../actions"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"

export default function NotificationQueueMonitor() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [processingResult, setProcessingResult] = useState<any>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null)

  const fetchStats = async () => {
    try {
      const data = await getQueueStats()
      setStats(data)
    } catch (error) {
      console.error("Error fetching queue stats:", error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(fetchStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  const handleProcessQueue = async () => {
    setLoading(true)
    try {
      const result = await processQueue()
      setProcessingResult(result)
      await fetchStats()
    } catch (error) {
      console.error("Error processing queue:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupQueue = async () => {
    setLoading(true)
    try {
      const result = await cleanupQueue()
      setCleanupResult(result)
      await fetchStats()
    } catch (error) {
      console.error("Error cleaning up queue:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRefresh = () => {
    if (refreshInterval) {
      setRefreshInterval(null)
    } else {
      setRefreshInterval(10000) // 10 seconds
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`
    }
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notification Queue Monitor</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRefresh}
              className={refreshInterval ? "bg-green-100" : ""}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {refreshInterval ? "Auto Refresh On" : "Auto Refresh Off"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Monitor and manage the notification queue</CardDescription>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="Pending" value={stats.pending} color="bg-yellow-100" />
              <StatCard title="Processing" value={stats.processing} color="bg-blue-100" />
              <StatCard title="Completed" value={stats.completed} color="bg-green-100" />
              <StatCard title="Failed" value={stats.failed} color="bg-red-100" />
              <StatCard title="Retry" value={stats.retry} color="bg-purple-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Avg Processing Time"
                value={stats.avg_processing_time ? formatTime(stats.avg_processing_time) : "N/A"}
                color="bg-blue-50"
              />
              <StatCard
                title="Max Processing Time"
                value={stats.max_processing_time ? formatTime(stats.max_processing_time) : "N/A"}
                color="bg-blue-50"
              />
              <StatCard
                title="Avg Retry Count"
                value={stats.avg_retry_count ? stats.avg_retry_count.toFixed(2) : "N/A"}
                color="bg-purple-50"
              />
            </div>

            {processingResult && (
              <div className="mt-4 p-4 rounded-md bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Last Processing Result</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-sm">
                    <span className="font-medium">Processed:</span> {processingResult.processed}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Success:</span> {processingResult.success}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Failed:</span> {processingResult.failed}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Time:</span> {processingResult.processingTime}
                  </div>
                </div>

                {processingResult.results && Object.keys(processingResult.results).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Batch Results</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Batch ID</TableHead>
                          <TableHead>Success</TableHead>
                          <TableHead>Failed</TableHead>
                          <TableHead>Avg Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(processingResult.results).map(([channel, result]: [string, any]) => (
                          <TableRow key={channel}>
                            <TableCell>
                              <Badge variant="outline">{channel}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{result.batchId.substring(0, 8)}...</TableCell>
                            <TableCell className="text-green-600">{result.successCount}</TableCell>
                            <TableCell className="text-red-600">{result.failureCount}</TableCell>
                            <TableCell>{formatTime(result.averageProcessingTime)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {cleanupResult && (
              <div className="mt-4 p-4 rounded-md bg-gray-50">
                <h3 className="text-sm font-medium">Cleanup Result</h3>
                <p className="text-sm mt-1">
                  Removed {cleanupResult.cleanup?.count || 0} old notification(s) from the queue.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleProcessQueue} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Process Queue
        </Button>
        <Button variant="outline" onClick={handleCleanupQueue} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Cleanup Old Items
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className={`p-4 rounded-md ${color}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
