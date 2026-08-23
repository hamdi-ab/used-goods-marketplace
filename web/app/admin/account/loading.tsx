import { Skeleton } from "@/components/ui/skeleton"

export default function AdminAccountLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-24" />
        <div className="mt-6 flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="mt-4 h-3 w-80" />
        <Skeleton className="mt-4 h-9 w-24" />
      </div>
    </div>
  )
}
