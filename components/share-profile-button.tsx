"use client"
import { Share2, Check } from "lucide-react"
import { ActionButton } from "@/components/ui/action-button"
import { useFeedbackAnimation } from "@/hooks/use-feedback-animation"
import { useToast } from "@/hooks/use-toast"

interface ShareProfileButtonProps {
  url: string
  title?: string
  text?: string
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  buttonText?: string
  successText?: string
  successDuration?: number
  onCopyFallback?: () => void
}

export function ShareProfileButton({
  url,
  title = "Kirim pesan anonim ke saya",
  text = "Kirim pesan anonim ke saya melalui SecretMe",
  className,
  variant = "default",
  size = "sm",
  showIcon = true,
  buttonText = "Bagikan",
  successText = "Dibagikan!",
  successDuration = 2000,
  onCopyFallback,
}: ShareProfileButtonProps) {
  const { toast } = useToast()
  const { state, startLoading, setSuccess } = useFeedbackAnimation({
    successDuration,
  })

  const shareProfile = async () => {
    startLoading()

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url,
        })
        setSuccess()

        toast({
          title: "Profil dibagikan",
          description: "Link profil telah dibagikan",
          variant: "success",
        })
      } else {
        // Fallback to copy if Web Share API is not available
        await navigator.clipboard.writeText(url)
        setSuccess()

        toast({
          title: "Link disalin",
          description: "Link profil telah disalin ke clipboard",
          variant: "success",
        })

        if (onCopyFallback) onCopyFallback()
      }
    } catch (error) {
      console.error("Failed to share:", error)
      toast({
        title: "Gagal membagikan",
        description: "Terjadi kesalahan saat membagikan profil",
        variant: "destructive",
      })
    }
  }

  return (
    <ActionButton
      variant={variant}
      size={size}
      className={className}
      onClick={shareProfile}
      isLoading={state === "loading"}
      isSuccess={state === "success"}
      successText={successText}
    >
      {showIcon && (state === "success" ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />)}
      {buttonText}
    </ActionButton>
  )
}
