"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFeedbackAnimation } from "@/hooks/use-feedback-animation"

interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  successDuration?: number
  errorDuration?: number
  onActionComplete?: () => void
}

export function FormSubmitButton({
  className,
  children,
  isLoading = false,
  isSuccess = false,
  isError = false,
  loadingText = "Menyimpan...",
  successText = "Tersimpan!",
  errorText = "Gagal!",
  variant = "default",
  size = "default",
  showIcon = true,
  successDuration = 2000,
  errorDuration = 2000,
  onActionComplete,
  ...props
}: FormSubmitButtonProps) {
  const {
    state,
    isLoading: isLoadingState,
    isSuccess: isSuccessState,
    isError: isErrorState,
    startLoading,
    setSuccess,
    setError,
  } = useFeedbackAnimation({
    successDuration,
    errorDuration,
    onComplete: onActionComplete,
  })

  React.useEffect(() => {
    if (isLoading) startLoading()
    else if (isSuccess) setSuccess()
    else if (isError) setError()
  }, [isLoading, isSuccess, isError, startLoading, setSuccess, setError])

  // Determine button text based on state
  const buttonText = React.useMemo(() => {
    if (isLoadingState && loadingText) return loadingText
    if (isSuccessState && successText) return successText
    if (isErrorState && errorText) return errorText
    return children
  }, [isLoadingState, isSuccessState, isErrorState, loadingText, successText, errorText, children])

  // Determine button variant based on state
  const buttonVariant = React.useMemo(() => {
    if (isSuccessState) return "success"
    if (isErrorState) return "destructive"
    return variant
  }, [isSuccessState, isErrorState, variant])

  return (
    <Button
      className={cn("transition-all duration-300 relative", isLoadingState && "cursor-not-allowed", className)}
      variant={buttonVariant}
      size={size}
      disabled={isLoadingState || props.disabled}
      {...props}
    >
      {isLoadingState && showIcon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSuccessState && showIcon && <Check className="mr-2 h-4 w-4" />}
      {isErrorState && showIcon && <AlertCircle className="mr-2 h-4 w-4" />}
      {buttonText}
    </Button>
  )
}
