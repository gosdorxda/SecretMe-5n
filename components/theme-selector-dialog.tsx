"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { TemplateTheme } from "@/lib/template-image-generator"
import { Check } from "lucide-react"

interface ThemeSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onThemeSelect: (theme: TemplateTheme) => void
  selectedTheme: TemplateTheme
}

export function ThemeSelectorDialog({ open, onOpenChange, onThemeSelect, selectedTheme }: ThemeSelectorDialogProps) {
  const [theme, setTheme] = useState<TemplateTheme>(selectedTheme)

  const handleSubmit = () => {
    onThemeSelect(theme)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pilih Tema</DialogTitle>
          <DialogDescription>Pilih tema untuk gambar yang akan dibagikan</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as TemplateTheme)}
            className="grid grid-cols-3 gap-4"
          >
            <div className="relative">
              <RadioGroupItem value="light" id="light" className="sr-only" />
              <Label
                htmlFor="light"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                  theme === "light" ? "border-primary" : "border-muted"
                }`}
              >
                <div className="w-full h-24 mb-2 rounded-md bg-white border border-gray-200 flex flex-col">
                  <div className="h-6 bg-orange-400 w-full"></div>
                  <div className="flex-1 p-2">
                    <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                    <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <span>Terang</span>
                {theme === "light" && (
                  <div className="absolute top-2 right-2 h-5 w-5 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </Label>
            </div>

            <div className="relative">
              <RadioGroupItem value="dark" id="dark" className="sr-only" />
              <Label
                htmlFor="dark"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                  theme === "dark" ? "border-primary" : "border-muted"
                }`}
              >
                <div className="w-full h-24 mb-2 rounded-md bg-gray-900 border border-gray-700 flex flex-col">
                  <div className="h-6 bg-gray-800 w-full"></div>
                  <div className="flex-1 p-2">
                    <div className="w-3/4 h-2 bg-gray-700 rounded mb-1"></div>
                    <div className="w-1/2 h-2 bg-gray-700 rounded"></div>
                  </div>
                </div>
                <span>Gelap</span>
                {theme === "dark" && (
                  <div className="absolute top-2 right-2 h-5 w-5 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </Label>
            </div>

            <div className="relative">
              <RadioGroupItem value="colorful" id="colorful" className="sr-only" />
              <Label
                htmlFor="colorful"
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                  theme === "colorful" ? "border-primary" : "border-muted"
                }`}
              >
                <div className="w-full h-24 mb-2 rounded-md bg-blue-50 border border-blue-200 flex flex-col">
                  <div className="h-6 bg-blue-500 w-full"></div>
                  <div className="flex-1 p-2">
                    <div className="w-3/4 h-2 bg-blue-200 rounded mb-1"></div>
                    <div className="w-1/2 h-2 bg-blue-200 rounded"></div>
                  </div>
                </div>
                <span>Berwarna</span>
                {theme === "colorful" && (
                  <div className="absolute top-2 right-2 h-5 w-5 text-primary">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            Terapkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
