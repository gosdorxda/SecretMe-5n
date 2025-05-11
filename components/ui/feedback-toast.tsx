"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default: "border-2 border-black bg-white text-foreground shadow-neo",
        destructive:
          "destructive group border-2 border-red-800 bg-red-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        success: "group border-2 border-green-800 bg-green-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        warning: "group border-2 border-yellow-800 bg-yellow-500 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        info: "group border-2 border-blue-800 bg-blue-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface FeedbackToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  visible: boolean
  onClose?: () => void
  autoClose?: boolean
  duration?: number
  showIcon?: boolean
}

export function FeedbackToast({
  className,
  variant = "default",
  visible,
  onClose,
  autoClose = true,
  duration = 3000,
  showIcon = true,
  children,
  ...props
}: FeedbackToastProps) {
  const [isVisible, setIsVisible] = React.useState(visible)

  React.useEffect(() => {
    setIsVisible(visible)

    if (visible && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible, autoClose, duration, onClose])

  if (!isVisible) return null

  const getIcon = () => {
    if (!showIcon) return null

    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "destructive":
        return <AlertCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "info":
        return <Info className="h-5 w-5" />
      default:
        return null
    }
  }

  return (
    <div
      className={cn(toastVariants({ variant }), "animate-in slide-in-from-top-full duration-300", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false)
            onClose()
          }}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
