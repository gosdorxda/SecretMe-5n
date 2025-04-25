"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Ubah definisi komponen Card untuk mendukung tampilan list dengan status pengguna

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asList?: boolean
    items?: {
      title: string
      description?: string
      icon?: React.ReactNode
      status?: {
        label: string
        variant?: "default" | "success" | "warning" | "error" | "info" | "inactive"
      }
    }[]
    stacked?: boolean
    stackedEffect?: "left" | "right" | "both"
    animated?: boolean
    tilt?: boolean
  }
>(
  (
    {
      className,
      asList,
      items,
      stacked = false,
      stackedEffect = "left",
      animated = false,
      tilt = false,
      children,
      ...props
    },
    ref,
  ) => {
    if (asList && items && items.length > 0) {
      return (
        <div ref={ref} className={cn("neo-card overflow-hidden", className)} {...props}>
          <ul className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                {item.icon && <div className="flex-shrink-0 mt-1">{item.icon}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    {item.status && (
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          item.status.variant === "success" && "bg-green-100 text-green-800",
                          item.status.variant === "warning" && "bg-yellow-100 text-yellow-800",
                          item.status.variant === "error" && "bg-red-100 text-red-800",
                          item.status.variant === "info" && "bg-blue-100 text-blue-800",
                          item.status.variant === "inactive" && "bg-gray-100 text-gray-600",
                          !item.status.variant && "bg-gray-100 text-gray-800",
                        )}
                      >
                        {item.status.label}
                      </span>
                    )}
                  </div>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className,
          stacked && "z-10",
          animated && "hover:translate-y-[-2px] hover:translate-x-[-2px] transition-transform duration-300",
          animated && "animate-subtle-shake",
          tilt && "rotate-[-1deg]",
        )}
        {...props}
      >
        {stacked && (
          <>
            {(stackedEffect === "left" || stackedEffect === "both") && (
              <div className="absolute inset-0 bg-white border-2 border-[var(--border)] rounded-[var(--border-radius)] -z-10 rotate-[-2deg] translate-x-[-5px] translate-y-[3px]"></div>
            )}
            {(stackedEffect === "right" || stackedEffect === "both") && (
              <div className="absolute inset-0 bg-white border-2 border-[var(--border)] rounded-[var(--border-radius)] -z-20 rotate-[2deg] translate-x-[5px] translate-y-[3px]"></div>
            )}
          </>
        )}
        {children}
      </div>
    )
  },
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col p-4 pb-2 sm:p-4 sm:pb-2", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight text-gray-800", className)}
      {...props}
    />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-base text-muted-foreground", className)} {...props} />
  ),
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    colorVariant?:
      | "blue"
      | "green"
      | "purple"
      | "pink"
      | "amber"
      | "orange"
      | "teal"
      | "indigo"
      | "rose"
      | "cyan"
      | "default"
    isProfile?: boolean
  }
>(({ className, colorVariant = "default", isProfile = false, ...props }, ref) => {
  const bgColorMap = {
    blue: "bg-blue-50/50",
    green: "bg-green-50/50",
    purple: "bg-purple-50/50",
    pink: "bg-pink-50/50",
    amber: "bg-amber-50/50",
    orange: "bg-orange-50/50",
    teal: "bg-teal-50/50",
    indigo: "bg-indigo-50/50",
    rose: "bg-rose-50/50",
    cyan: "bg-cyan-50/50",
    default: "",
  }

  // Hapus kelas p-6 dan sm:p-6 dari className jika ada
  const filteredClassName = className?.replace(/\bp-6\b|\bsm:p-6\b/g, "") || ""

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        bgColorMap[colorVariant],
        // Remove any p-6 related classes and ensure p-4 is applied consistently
        filteredClassName,
      )}
      {...props}
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 pt-0 sm:p-4 sm:pt-0", className)} {...props} />
  ),
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
