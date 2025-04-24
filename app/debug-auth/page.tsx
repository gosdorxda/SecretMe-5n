"use client"

import { useEffect, useState } from "react"
import { createClient, repairSession } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, RefreshCw, Trash2, PenToolIcon as Tool } from "lucide-react"

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [cookies, setCookies] = useState<string>("")
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [clearStatus, setClearStatus] = useState<string | null>(null)
  const [repairStatus, setRepairStatus] = useState<string | null>(null)

  const checkAuth = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      setAuthStatus({
        hasSession: !!data.session,
        error: error?.message,
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        provider: data.session?.user?.app_metadata?.provider,
        accessToken: data.session?.access_token ? data.session.access_token.substring(0, 10) + "..." : null,
        refreshToken: data.session?.refresh_token ? data.session.refresh_token.substring(0, 10) + "..." : null,
        expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : null,
      })

      setCookies(document.cookie)

      try {
        const supabaseAuthToken = window.localStorage.getItem("supabase.auth.token")
        setLocalStorageData(supabaseAuthToken ? JSON.parse(supabaseAuthToken) : null)
      } catch (e: any) {
        setLocalStorageData({ error: e.message })
      }
    } catch (e: any) {
      setAuthStatus({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const clearAuthData = () => {
    try {
      // Clear localStorage
      localStorage.removeItem("supabase.auth.token")

      // Clear cookies
      document.cookie = "sb-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      // Additional cookies that might be used
      document.cookie = "supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      setClearStatus("Auth data cleared successfully")

      // Refresh the data
      checkAuth()
    } catch (e: any) {
      setClearStatus(`Error clearing auth data: ${e.message}`)
    }
  }

  const handleRepairSession = async () => {
    setRepairStatus("Attempting to repair session...")
    try {
      const result = await repairSession()
      if (result) {
        setRepairStatus("Session repaired successfully!")
      } else {
        setRepairStatus("Could not repair session. No valid token found in localStorage.")
      }
      // Refresh the data
      checkAuth()
    } catch (e: any) {
      setRepairStatus(`Error repairing session: ${e.message}`)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Auth Debug</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={checkAuth} variant="outline" disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {clearStatus && (
        <div className={`p-4 mb-4 rounded-md ${clearStatus.includes("Error") ? "bg-red-100" : "bg-green-100"}`}>
          {clearStatus}
        </div>
      )}

      {repairStatus && (
        <div
          className={`p-4 mb-4 rounded-md ${repairStatus.includes("Error") || repairStatus.includes("Could not") ? "bg-red-100" : "bg-green-100"}`}
        >
          {repairStatus}
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Auth Status
              {authStatus?.hasSession ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" /> Authenticated
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 ml-2">
                  <AlertCircle className="h-3 w-3 mr-1" /> Not Authenticated
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Current authentication status from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookies</CardTitle>
            <CardDescription>Current cookies in the browser</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : cookies ? (
              <div>
                {cookies.split(";").map((cookie, index) => (
                  <div key={index} className="mb-2 p-2 bg-gray-100 rounded">
                    {cookie.trim()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-yellow-600 bg-yellow-100 p-4 rounded">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                No cookies found
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LocalStorage</CardTitle>
            <CardDescription>Supabase auth token in localStorage</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
                {JSON.stringify(localStorageData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Actions to help resolve auth issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Common Issues:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Missing or invalid cookies</li>
                  <li>Third-party cookie blocking</li>
                  <li>SameSite cookie policy conflicts</li>
                  <li>Expired or invalid tokens</li>
                  <li>Mismatched domains in configuration</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Suggested Actions:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check browser cookie settings</li>
                  <li>Verify Supabase URL Configuration</li>
                  <li>Confirm Google OAuth redirect URIs</li>
                  <li>Try a different browser</li>
                  <li>Clear auth data and try again</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="destructive" onClick={clearAuthData} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Auth Data
            </Button>
            <Button variant="secondary" onClick={handleRepairSession} className="flex items-center gap-2">
              <Tool className="h-4 w-4" />
              Repair Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
