"use client"
import { Copy, Check } from "lucide-react"
import { ActionButton } from "@/components/ui/action-button"
import { useFeedbackAnimation } from "@/hooks/use-feedback-animation"
import { useToast } from "@/hooks/use-toast"

interface CopyLinkButtonProps {
  url: string
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  text?: string
  successText?: string
  successDuration?: number
}

export function CopyLinkButton({
  url,
  className,
  variant = "outline",
  size = "sm",
  showIcon = true,
  text = "Salin Link",
  successText = "Disalin!",
  successDuration = 2000,
}: CopyLinkButtonProps) {
  const { toast } = useToast()
  const { state, startLoading, setSuccess } = useFeedbackAnimation({
    successDuration,
  })

  const copyToClipboard = async () => {
    startLoading()

    try {
      await navigator.clipboard.writeText(url)
      setSuccess()

      toast({
        title: "Link disalin",
        description: "Link telah disalin ke clipboard",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to copy:", error)
      toast({
        title: "Gagal menyalin link",
        description: "Terjadi kesalahan saat menyalin link",
        variant: "destructive",
      })
    }
  }

  return (
    <ActionButton
      variant={variant}
      size={size}
      className={className}
      onClick={copyToClipboard}
      isLoading={state === "loading"}
      isSuccess={state === "success"}
      successText={successText}
    >
      {showIcon && (state === "success" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />)}
      {text}
    </ActionButton>
  )
}
