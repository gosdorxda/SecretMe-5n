"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function AuthDebugPage() {
  const [loading, setLoading] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get cookies
        setCookies(document.cookie.split(";").map((cookie) => cookie.trim()))

        // Get localStorage items related to Supabase
        const storageItems: Record<string, string> = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes("supabase") || key.includes("sb-"))) {
            storageItems[key] = localStorage.getItem(key) || ""
          }
        }
        setLocalStorageData(storageItems)

        // Get session
        const supabase = createClient()
        const { data: session, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
        }

        setSessionData(session)

        // Get user if session exists
        if (session?.session?.user) {
          const { data: user, error: userError } = await supabase.auth.getUser()

          if (userError) {
            console.error("Error getting user:", userError)
          }

          setUserData(user)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const handleClearStorage = () => {
    // Clear localStorage items related to Supabase
    Object.keys(localStorageData).forEach((key) => {
      localStorage.removeItem(key)
    })

    // Reload page
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Session</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </div>

              {userData && (
                <div>
                  <h3 className="font-medium mb-2">User</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Cookies</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {cookies.length > 0 ? cookies.join("\n") : "No cookies found"}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">LocalStorage (Supabase related)</h3>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {Object.keys(localStorageData).length > 0
                    ? JSON.stringify(localStorageData, null, 2)
                    : "No Supabase related items in localStorage"}
                </pre>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Go to Login</Link>
                </Button>
                <Button variant="destructive" onClick={handleSignOut}>
                  Sign Out
                </Button>
                <Button variant="secondary" onClick={handleClearStorage}>
                  Clear Storage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
