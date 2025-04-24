import { Skeleton } from "@/components/ui/skeleton"

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-[var(--border-radius)]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-[var(--border-radius)]" />
        <Skeleton className="h-4 w-full rounded-[var(--border-radius)]" />
        <Skeleton className="h-4 w-2/3 rounded-[var(--border-radius)]" />
      </div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[120px] rounded-[var(--border-radius)]" />
          <Skeleton className="h-3 w-[80px] rounded-[var(--border-radius)]" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-[var(--border-radius)]" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px] rounded-[var(--border-radius)]" />
        <Skeleton className="h-8 w-[100px] rounded-[var(--border-radius)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full rounded-[var(--border-radius)]" />
        <Skeleton className="h-40 w-full rounded-[var(--border-radius)]" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-[150px] rounded-[var(--border-radius)]" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-[var(--border-radius)]" />
          <Skeleton className="h-20 w-full rounded-[var(--border-radius)]" />
          <Skeleton className="h-20 w-full rounded-[var(--border-radius)]" />
        </div>
      </div>
    </div>
  )
}
