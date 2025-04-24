"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function RateLimitConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    maxMessagesPerDay: 5,
    maxMessagesPerHour: 3,
    blockDurationHours: 24,
  })
  const { toast } = useToast()

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/rate-limit/config")
        if (!response.ok) {
          throw new Error("Failed to fetch rate limit config")
        }
        const data = await response.json()
        setConfig({
          maxMessagesPerDay: data.max_messages_per_day,
          maxMessagesPerHour: data.max_messages_per_hour,
          blockDurationHours: data.block_duration_hours,
        })
      } catch (error) {
        console.error("Error fetching rate limit config:", error)
        toast({
          title: "Error",
          description: "Gagal memuat konfigurasi rate limit",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({
      ...prev,
      [name]: Number.parseInt(value, 10) || 0,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/rate-limit/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save rate limit config")
      }

      toast({
        title: "Sukses",
        description: "Konfigurasi rate limit berhasil disimpan",
      })
    } catch (error) {
      console.error("Error saving rate limit config:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan konfigurasi rate limit",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Rate Limit</CardTitle>
          <CardDescription>Memuat...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konfigurasi Rate Limit</CardTitle>
        <CardDescription>Atur batasan pengiriman pesan untuk mencegah spam</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxMessagesPerDay">Maksimum Pesan per Hari</Label>
            <Input
              id="maxMessagesPerDay"
              name="maxMessagesPerDay"
              type="number"
              min="1"
              value={config.maxMessagesPerDay}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              Jumlah maksimum pesan yang dapat dikirim ke penerima yang sama dalam 24 jam
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxMessagesPerHour">Maksimum Pesan per Jam</Label>
            <Input
              id="maxMessagesPerHour"
              name="maxMessagesPerHour"
              type="number"
              min="1"
              value={config.maxMessagesPerHour}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              Jumlah maksimum pesan yang dapat dikirim ke penerima yang sama dalam 1 jam
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blockDurationHours">Durasi Blokir (Jam)</Label>
            <Input
              id="blockDurationHours"
              name="blockDurationHours"
              type="number"
              min="1"
              value={config.blockDurationHours}
              onChange={handleChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              Berapa lama (dalam jam) pengguna diblokir setelah melebihi batas pengiriman
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
