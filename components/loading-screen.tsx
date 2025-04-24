import { MessageSquare } from "lucide-react"

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Memuat..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg)] z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo dengan styling yang selaras dengan navigasi */}
        <div className="w-16 h-16 rounded-[var(--border-radius)] bg-[var(--main)] border-2 border-[var(--border)] flex items-center justify-center shadow-[var(--shadow)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
          <MessageSquare className="w-8 h-8 text-[var(--mtext)]" />
        </div>

        {/* Teks loading dengan animasi titik */}
        <div className="text-center mt-4">
          <p className="text-lg font-medium">{message}</p>
        </div>

        {/* Loading bar sederhana */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-[var(--main)] animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
