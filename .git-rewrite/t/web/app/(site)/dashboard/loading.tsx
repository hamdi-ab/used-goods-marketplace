import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="mb-8">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-3 h-9 w-72" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>

      {/* Stat tiles skeleton */}
      <section className="mb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-2 h-6 w-12" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          ))}
        </div>
      </section>

      {/* Listings section skeleton */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-72 max-w-full" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-20 w-24" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg border bg-card" />
        ))}
      </div>
    </main>
  )
}
