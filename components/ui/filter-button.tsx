"use client"

import type * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean
  activeClassName?: string
  inactiveClassName?: string
  size?: "default" | "sm" | "lg"
}

export function FilterButton({
  children,
  isActive,
  activeClassName,
  inactiveClassName,
  className,
  size = "sm",
  ...props
}: FilterButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size={size}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isActive ? activeClassName : inactiveClassName,
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layoutId="activeFilterBackground"
          className="absolute inset-0 bg-[var(--main)] -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {children}
    </Button>
  )
}
