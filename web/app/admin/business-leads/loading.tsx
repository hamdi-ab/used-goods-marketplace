import { Skeleton } from "@/components/ui/skeleton"

export default function BusinessLeadsLoading() {
  return (
    <div>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-3 w-48" />
            <Skeleton className="mt-3 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
