interface LoadingInlineProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingInline({ size = "md", className }: LoadingInlineProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`border-2 border-[var(--main)] border-t-transparent rounded-full animate-spin ${sizeClasses[size]}`}
      />
    </div>
  )
}
