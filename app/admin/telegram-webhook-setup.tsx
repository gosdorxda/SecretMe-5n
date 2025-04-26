"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function TelegramWebhookSetup() {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [currentWebhook, setCurrentWebhook] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInfo, setIsLoadingInfo] = useState(true)

  // Dapatkan informasi webhook saat ini saat komponen dimuat
  useEffect(() => {
    fetchWebhookInfo()
  }, [])

  const fetchWebhookInfo = async () => {
    try {
      setIsLoadingInfo(true)
      const response = await fetch("/api/telegram/setup-webhook", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get webhook info")
      }

      setCurrentWebhook(data.webhookInfo)

      // Pre-fill the input with the current webhook URL if it exists
      if (data.webhookInfo && data.webhookInfo.url) {
        setWebhookUrl(data.webhookInfo.url)
      } else {
        // Suggest a default webhook URL based on the current domain
        const domain = window.location.origin
        setWebhookUrl(`${domain}/api/telegram/webhook`)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get webhook info",
        variant: "destructive",
      })
    } finally {
      setIsLoadingInfo(false)
    }
  }

  const handleSetWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Webhook URL is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/telegram/setup-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhookUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set webhook")
      }

      toast({
        title: "Success",
        description: "Webhook set successfully",
      })

      // Refresh webhook info
      fetchWebhookInfo()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set webhook",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Webhook Setup</CardTitle>
        <CardDescription>
          Configure the webhook URL for your Telegram bot to receive messages and commands
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              placeholder="https://yourdomain.com/api/telegram/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              This URL will receive updates from Telegram when users interact with your bot
            </p>
          </div>

          {isLoadingInfo ? (
            <div className="text-sm">Loading current webhook info...</div>
          ) : currentWebhook ? (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-medium">Current Webhook Info:</h3>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(currentWebhook, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No webhook currently set</div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSetWebhook} disabled={isLoading}>
          {isLoading ? "Setting Webhook..." : "Set Webhook"}
        </Button>
      </CardFooter>
    </Card>
  )
}
