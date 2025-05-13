"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { isMobileDevice } from "@/lib/auth-cache"

export function AuthTroubleshooter() {
  const { session, user, isAuthenticated, refreshSession, forceLogout } = useAuth()
  const [showTroubleshooter, setShowTroubleshooter] = useState(false)
  const [diagnosisResults, setDiagnosisResults] = useState<{
    sessionValid: boolean
    tokenValid: boolean
    cookiesEnabled: boolean
    localStorageEnabled: boolean
    isMobile: boolean
    browserInfo: string
  } | null>(null)

  // Fungsi untuk mendiagnosis masalah autentikasi
  const runDiagnosis = async () => {
    try {
      // Cek apakah cookies diaktifkan
      const cookiesEnabled = navigator.cookieEnabled

      // Cek apakah localStorage diaktifkan
      let localStorageEnabled = false
      try {
        localStorage.setItem("test", "test")
        localStorage.removeItem("test")
        localStorageEnabled = true
      } catch (e) {
        localStorageEnabled = false
      }

      // Cek apakah token valid
      const tokenValid = !!session?.access_token && !isTokenExpired(session)

      // Cek apakah session valid
      const sessionValid = !!session && !!user

      // Dapatkan info browser
      const browserInfo = navigator.userAgent

      // Set hasil diagnosis
      setDiagnosisResults({
        sessionValid,
        tokenValid,
        cookiesEnabled,
        localStorageEnabled,
        isMobile: isMobileDevice(),
        browserInfo,
      })
    } catch (error) {
      console.error("Error running diagnosis:", error)
    }
  }

  // Fungsi untuk memeriksa apakah token kedaluwarsa
  const isTokenExpired = (session: any) => {
    if (!session.expires_at) return false
    const expiresAt = session.expires_at * 1000 // Convert to milliseconds
    return Date.now() >= expiresAt
  }

  // Tampilkan troubleshooter jika ada masalah autentikasi
  useEffect(() => {
    if (isAuthenticated && (!session || !user)) {
      setShowTroubleshooter(true)
      runDiagnosis()
    }
  }, [isAuthenticated, session, user])

  if (!showTroubleshooter) return null

  return (
    <Card className="w-full max-w-md mx-auto mt-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertTriangle size={20} />
          Masalah Autentikasi Terdeteksi
        </CardTitle>
        <CardDescription>
          Kami mendeteksi masalah dengan sesi login Anda. Gunakan alat ini untuk memperbaikinya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {diagnosisResults ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {diagnosisResults.sessionValid ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-orange-500" />
              )}
              <span>Sesi: {diagnosisResults.sessionValid ? "Valid" : "Tidak Valid"}</span>
            </div>
            <div className="flex items-center gap-2">
              {diagnosisResults.tokenValid ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-orange-500" />
              )}
              <span>Token: {diagnosisResults.tokenValid ? "Valid" : "Tidak Valid/Kedaluwarsa"}</span>
            </div>
            <div className="flex items-center gap-2">
              {diagnosisResults.cookiesEnabled ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-orange-500" />
              )}
              <span>Cookies: {diagnosisResults.cookiesEnabled ? "Diaktifkan" : "Dinonaktifkan"}</span>
            </div>
            <div className="flex items-center gap-2">
              {diagnosisResults.localStorageEnabled ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-orange-500" />
              )}
              <span>LocalStorage: {diagnosisResults.localStorageEnabled ? "Diaktifkan" : "Dinonaktifkan"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Perangkat: {diagnosisResults.isMobile ? "Mobile" : "Desktop"}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <RefreshCw size={24} className="animate-spin text-orange-500" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={refreshSession} className="flex-1">
            <RefreshCw size={16} className="mr-2" />
            Refresh Sesi
          </Button>
          <Button variant="destructive" onClick={forceLogout} className="flex-1">
            <AlertTriangle size={16} className="mr-2" />
            Force Logout
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setShowTroubleshooter(false)} className="w-full text-muted-foreground">
          Tutup
        </Button>
      </CardFooter>
    </Card>
  )
}
