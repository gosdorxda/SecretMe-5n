export default function CallbackLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Memproses autentikasi...</h2>
        <p className="text-muted-foreground">Mohon tunggu sebentar, Anda akan segera dialihkan.</p>
      </div>
    </div>
  )
}
