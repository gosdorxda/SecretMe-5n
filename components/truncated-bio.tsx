"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface TruncatedBioProps {
  bio: string
  maxLength?: number
}

export function TruncatedBio({ bio, maxLength = 150 }: TruncatedBioProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isTooLong = bio.length > maxLength

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const displayedBio = isExpanded ? bio : bio.slice(0, maxLength) + (isTooLong ? "..." : "")

  return (
    <div className="w-full max-w-md">
      <p className="text-base leading-relaxed opacity-75" style={{ color: "var(--text)" }}>
        {displayedBio}
      </p>

      {isTooLong && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          className="mt-1 h-6 text-xs text-gray-500 hover:text-gray-700 px-2 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Tampilkan kurang
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Tampilkan lebih
            </>
          )}
        </Button>
      )}
    </div>
  )
}
