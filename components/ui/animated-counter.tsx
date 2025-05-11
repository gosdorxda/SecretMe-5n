"use client"

import * as React from "react"
import { motion, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  formatter?: (value: number) => string
}

export function AnimatedCounter({
  value,
  duration = 1,
  className,
  formatter = (value) => value.toString(),
}: AnimatedCounterProps) {
  const springValue = useSpring(0, { duration })
  const displayValue = useTransform(springValue, (latest) => formatter(Math.round(latest)))

  React.useEffect(() => {
    springValue.set(value)
  }, [value, springValue])

  return <motion.span className={cn("tabular-nums", className)}>{displayValue}</motion.span>
}
