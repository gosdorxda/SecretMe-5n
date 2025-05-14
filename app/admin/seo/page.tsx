import SeoSettings from "../components/seo-settings"

export const dynamic = "force-dynamic"

export default async function SeoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan SEO</h1>
        <p className="text-muted-foreground">Kelola SEO dan visibilitas website di mesin pencari.</p>
      </div>

      <SeoSettings />
    </div>
  )
}
