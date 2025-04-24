"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function ToastDemo() {
  const { toast } = useToast()

  // Fungsi untuk menampilkan toast dengan debounce
  const showToast = (props: Parameters<typeof toast>[0]) => {
    toast(props)
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-2">Toast Demo</h2>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            showToast({
              title: "Default Toast",
              description: "Ini adalah toast default dengan desain neobrutalism",
            })
          }}
        >
          Default
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            showToast({
              variant: "destructive",
              title: "Error!",
              description: "Terjadi kesalahan saat memproses permintaan Anda.",
            })
          }}
        >
          Error
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            showToast({
              variant: "success",
              title: "Berhasil!",
              description: "Operasi berhasil dilakukan dengan sempurna.",
            })
          }}
        >
          Success
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            showToast({
              variant: "warning",
              title: "Peringatan",
              description: "Harap perhatikan hal ini sebelum melanjutkan.",
            })
          }}
        >
          Warning
        </Button>

        <Button
          variant="default"
          onClick={() => {
            showToast({
              title: "Dengan Aksi",
              description: "Toast dengan tombol aksi yang dapat diklik.",
              action: (
                <Button variant="outline" size="sm" className="neo-btn-outline text-xs h-7 px-2">
                  Undo
                </Button>
              ),
            })
          }}
        >
          Dengan Aksi
        </Button>
      </div>
    </div>
  )
}
