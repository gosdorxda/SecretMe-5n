"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Settings } from "lucide-react"
import Link from "next/link"

interface AdminHeaderProps {
  userId: string
}

export default function AdminHeader({ userId }: AdminHeaderProps) {
  const [adminName, setAdminName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadAdminData() {
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).single()

      if (data) {
        setAdminName(data.full_name || "Admin")
        setAvatarUrl(data.avatar_url || "")
      }
    }

    loadAdminData()
  }, [userId, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang kembali, {adminName}</p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={adminName} />
          <AvatarFallback>{adminName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>

          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
