"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { MessagesTab } from "./tabs/messages-tab"
import { ProfileTab } from "./tabs/profile-tab"
import { SettingsTab } from "./tabs/settings-tab"
import { NotificationTab } from "./tabs/notification-tab" // Import tab notifikasi baru
import type { Database } from "@/lib/supabase/database.types"

type UserType = Database["public"]["Tables"]["users"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]

interface DashboardTabsProps {
  user: UserType
  messages: Message[]
  viewCount: number
}

export function DashboardTabs({ user, messages, viewCount }: DashboardTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("messages")
  const { toast } = useToast()

  // Set active tab based on URL parameter
  useEffect(() => {
    if (tabParam && ["messages", "profile", "settings", "notifications"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard?tab=${value}`, { scroll: false })
  }

  function copyProfileLink() {
    const profileUrl = `${window.location.origin}/${user.is_premium && user.username ? user.username : user.numeric_id}`
    navigator.clipboard.writeText(profileUrl)
    toast({
      title: "Link disalin",
      description: "Link profil Anda telah disalin ke clipboard",
    })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6 p-0.5 h-10 gap-1">
        <TabsTrigger value="messages" className="rounded-md text-xs">
          <span>Pesan</span>
        </TabsTrigger>
        <TabsTrigger value="profile" className="rounded-md text-xs">
          <span>Profil</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="rounded-md text-xs">
          <span>Notifikasi</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="rounded-md text-xs">
          <span>Pengaturan</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="messages">
        <MessagesTab user={user} messages={messages} onCopyProfileLink={copyProfileLink} />
      </TabsContent>

      <TabsContent value="profile">
        <ProfileTab user={user} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationTab user={user} />
      </TabsContent>

      <TabsContent value="settings">
        <SettingsTab user={user} />
      </TabsContent>
    </Tabs>
  )
}
