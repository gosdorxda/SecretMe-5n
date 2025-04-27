"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { QueueStats, NotificationQueueItem } from "@/lib/queue/types"
import { RefreshCw, Play, Trash2 } from "lucide-react"
import { processNotificationQueue, cleanupOldQueueItems, getQueueStats } from "../actions"

export default function NotificationQueueMonitor() {
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    retry: 0,
    total: 0,
  })
  const [queueItems, setQueueItems] = useState<NotificationQueueItem[]>([])
  const [activeTab, setActiveTab] = useState<string>("pending")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  // Fungsi untuk memuat statistik antrian
  const loadStats = async () => {
    try {
      const result = await getQueueStats()

      if (!result.success) {
        throw new Error(result.error || "Failed to load queue stats")
      }

      setStats(result.stats)
    } catch (error) {
      console.error("Error loading queue stats:", error)
      toast({
        title: "Error",
        description: "Failed to load queue statistics",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk memuat item antrian berdasarkan status
  const loadQueueItems = async (status: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("notification_queue")
        .select("*")
        .eq("status", status)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error

      setQueueItems(data || [])
    } catch (error) {
      console.error(`Error loading ${status} queue items:`, error)
      toast({
        title: "Error",
        description: `Failed to load ${status} queue items`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi untuk memproses antrian secara manual menggunakan server action
  const handleProcessQueue = async () => {
    setIsProcessing(true)
    try {
      const result = await processNotificationQueue(20)

      if (!result.success) {
        throw new Error(result.error || "Failed to process queue")
      }

      toast({
        title: "Success",
        description: `Processed ${result.processedCount} notifications`,
      })

      // Refresh data
      await loadStats()
      await loadQueueItems(activeTab)
    } catch (error) {
      console.error("Error processing queue:", error)
      toast({
        title: "Error",
        description: "Failed to process notification queue",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Fungsi untuk membersihkan antrian lama menggunakan server action
  const handleCleanupOldItems = async () => {
    setIsCleaning(true)
    try {
      const result = await cleanupOldQueueItems(7)

      if (!result.success) {
        throw new Error(result.error || "Failed to clean up old items")
      }

      toast({
        title: "Success",
        description: `Cleaned up ${result.cleanedCount} old notifications`,
      })

      // Refresh data
      await loadStats()
      await loadQueueItems(activeTab)
    } catch (error) {
      console.error("Error cleaning up old items:", error)
      toast({
        title: "Error",
        description: "Failed to clean up old notifications",
        variant: "destructive",
      })
    } finally {
      setIsCleaning(false)
    }
  }

  // Fungsi untuk mendapatkan badge berdasarkan status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Failed
          </Badge>
        )
      case "retry":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Retry
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Efek untuk memuat data saat komponen dimuat
  useEffect(() => {
    loadStats()
    loadQueueItems("pending")
  }, [])

  // Efek untuk memuat item antrian saat tab berubah
  useEffect(() => {
    loadQueueItems(activeTab)
  }, [activeTab])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Queue Monitor</CardTitle>
        <CardDescription>Monitor and manage notification queue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-blue-700">Pending</p>
              <p className="text-2xl font-bold text-blue-900">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-yellow-700">Processing</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.processing}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-red-700">Failed</p>
              <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-purple-700">Retry</p>
              <p className="text-2xl font-bold text-purple-900">{stats.retry}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => {
              loadStats()
              loadQueueItems(activeTab)
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="space-x-2">
            <Button variant="default" onClick={handleProcessQueue} disabled={isProcessing}>
              <Play className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Process Queue"}
            </Button>
            <Button variant="outline" onClick={handleCleanupOldItems} disabled={isCleaning}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isCleaning ? "Cleaning..." : "Clean Old Items"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="retry">Retry</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="border rounded-md">
              {isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : queueItems.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No {activeTab} notifications found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {queueItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{item.notification_type}</div>
                          <div className="text-sm text-muted-foreground">Channel: {item.channel}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(item.status)}
                          <Badge variant="outline" className="bg-gray-50">
                            Priority: {item.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Updated: </span>
                          {new Date(item.updated_at).toLocaleString()}
                        </div>
                      </div>
                      {item.status === "retry" && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Next retry: </span>
                          {item.next_retry_at ? new Date(item.next_retry_at).toLocaleString() : "N/A"}
                          <span className="ml-4 text-muted-foreground">Attempts: </span>
                          {item.retry_count} / {item.max_retries}
                        </div>
                      )}
                      {item.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          <span className="font-medium">Error: </span>
                          {item.error_message}
                        </div>
                      )}
                      <div className="mt-2 text-sm">
                        <details>
                          <summary className="cursor-pointer text-muted-foreground">Payload</summary>
                          <pre className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto">
                            {JSON.stringify(item.payload, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">Showing up to 50 most recent {activeTab} notifications</div>
        <div className="text-sm text-muted-foreground">Total: {stats.total} notifications</div>
      </CardFooter>
    </Card>
  )
}
