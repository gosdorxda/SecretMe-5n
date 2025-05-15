import { Loader2 } from "lucide-react"

export function AvatarSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-full">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  )
}
