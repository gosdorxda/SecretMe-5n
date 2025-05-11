"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const actionFeedbackVariants = cva("transition-all duration-300", {
  variants: {
    state: {
      idle: "",
      loading: "relative",
      success: "bg-green-600 border-green-800 text-white hover:bg-green-700",
      error: "bg-red-600 border-red-800 text-white hover:bg-red-700",
    },
  },
  defaultVariants: {
    state: "idle",
  },
})

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionFeedbackVariants> {
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  loadingText?: string
  successText?: string
  errorText?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" | "gradient"
  size?: "default" | "sm" | "lg" | "icon"
  successDuration?: number
  errorDuration?: number
  onActionComplete?: () => void
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  (
    {
      className,
      children,
      isLoading = false,
      isSuccess = false,
      isError = false,
      loadingText,
      successText,
      errorText,
      variant = "default",
      size = "default",
      successDuration = 2000,
      errorDuration = 2000,
      onActionComplete,
      ...props
    },
    ref,
  ) => {
    const [state, setState] = React.useState<"idle" | "loading" | "success" | "error">("idle")

    React.useEffect(() => {
      if (isLoading) {
        setState("loading")
      } else if (isSuccess) {
        setState("success")
        const timer = setTimeout(() => {
          setState("idle")
          if (onActionComplete) onActionComplete()
        }, successDuration)
        return () => clearTimeout(timer)
      } else if (isError) {
        setState("error")
        const timer = setTimeout(() => {
          setState("idle")
          if (onActionComplete) onActionComplete()
        }, errorDuration)
        return () => clearTimeout(timer)
      } else {
        setState("idle")
      }
    }, [isLoading, isSuccess, isError, successDuration, errorDuration, onActionComplete])

    // Determine button text based on state
    const buttonText = React.useMemo(() => {
      if (state === "loading" && loadingText) return loadingText
      if (state === "success" && successText) return successText
      if (state === "error" && errorText) return errorText
      return children
    }, [state, loadingText, successText, errorText, children])

    // Determine button variant based on state
    const buttonVariant = React.useMemo(() => {
      if (state === "success") return "success"
      if (state === "error") return "destructive"
      return variant
    }, [state, variant])

    return (
      <Button
        className={cn(
          actionFeedbackVariants({ state }),
          "transition-all duration-300 relative",
          state === "loading" && "!text-opacity-0",
          className,
        )}
        variant={buttonVariant}
        size={size}
        disabled={isLoading || isSuccess || isError || props.disabled}
        ref={ref}
        {...props}
      >
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText && <span className="ml-2">{loadingText}</span>}
          </div>
        )}
        {buttonText}
      </Button>
    )
  },
)

ActionButton.displayName = "ActionButton"
