import { Skeleton } from "@/components/ui/skeleton"

export function ActivityTabsSkeleton() {
  return (
    <div className="mb-6 flex gap-4 border-b pb-3">
      <Skeleton className="h-9 w-24 rounded-md" />
      <Skeleton className="h-9 w-28 rounded-md" />
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  )
}

export function ActivityListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl border bg-card p-4">
          <Skeleton className="size-16 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2 py-1">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-6">
      <ActivityTabsSkeleton />
      <ActivityListSkeleton />
    </div>
  )
}
