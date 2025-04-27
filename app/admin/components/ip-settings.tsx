"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Ban } from "lucide-react"
import RateLimitConfig from "./rate-limit-config"
import BlockedIPs from "./blocked-ips"

export default function IPSettings() {
  const [activeTab, setActiveTab] = useState("rate-limit")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pengaturan IP</h2>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="rate-limit">
            <Shield className="h-4 w-4 mr-2" />
            Rate Limit
          </TabsTrigger>
          <TabsTrigger value="blocked-ips">
            <Ban className="h-4 w-4 mr-2" />
            IP Diblokir
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rate-limit" className="space-y-4">
          <RateLimitConfig />
        </TabsContent>

        <TabsContent value="blocked-ips" className="space-y-4">
          <BlockedIPs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
