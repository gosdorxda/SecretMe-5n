import React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps {
  variant?: "default" | "outline" | "premium"
  size?: "sm" | "default" | "lg"
  className?: string
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80",
      outline: "text-foreground border border-border",
      premium: "bg-primary text-primary-foreground",
    }

    const sizeStyles = {
      sm: "text-xs px-1.5 py-0.5",
      default: "text-sm px-2.5 py-0.5",
      lg: "text-base px-3 py-1",
    }

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Badge.displayName = "Badge"

export { Badge }
