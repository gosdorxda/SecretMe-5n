import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return <textarea className={cn("neo-input min-h-[80px] w-full", className)} ref={ref} {...props} />
})
Textarea.displayName = "Textarea"

export { Textarea }
