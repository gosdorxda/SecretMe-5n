import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--border-radius)] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "neo-btn",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-black shadow-neo hover:shadow-none font-bold",
        outline: "neo-btn-outline",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-black shadow-neo hover:shadow-none font-bold",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white border-2 border-black shadow-neo hover:shadow-none font-bold",
        warning: "bg-yellow-500 text-black border-2 border-black shadow-neo hover:shadow-none font-bold",
        gradient: "bg-main text-black border-2 border-black shadow-neo hover:shadow-none font-bold",
      },
      size: {
        default: "h-11 px-4 py-2 text-base",
        sm: "h-9 rounded-[var(--border-radius)] px-3 text-sm",
        lg: "h-12 rounded-[var(--border-radius)] px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
